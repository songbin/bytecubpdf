import os
import sys
import time
from pathlib import Path

try:
    import psutil
except ImportError:
    psutil = None


def _parse_pss_from_smaps_rollup(pid: int) -> int | None:
    """
    Try to read PSS from /proc/<pid>/smaps_rollup.
    Returns PSS in bytes, or None if not available/readable.
    """
    try:
        smaps_rollup_path = Path(f"/proc/{pid}/smaps_rollup")
        with smaps_rollup_path.open() as f:
            for line in f:
                if line.startswith("Pss:"):
                    # Format: "Pss:            1234 kB"
                    parts = line.split()
                    if len(parts) >= 2:
                        pss_kb = int(parts[1])
                        return pss_kb * 1024  # Convert to bytes
        return None
    except (FileNotFoundError, PermissionError, ValueError, OSError):
        return None


def _parse_pss_from_smaps(pid: int) -> int | None:
    """
    Try to read PSS from /proc/<pid>/smaps and sum all Pss entries.
    Returns PSS in bytes, or None if not available/readable.
    """
    try:
        smaps_path = Path(f"/proc/{pid}/smaps")
        total_pss_kb = 0
        with smaps_path.open() as f:
            for line in f:
                if line.startswith("Pss:"):
                    # Format: "Pss:            1234 kB"
                    parts = line.split()
                    if len(parts) >= 2:
                        total_pss_kb += int(parts[1])
        if total_pss_kb > 0:
            return total_pss_kb * 1024  # Convert to bytes
        return None
    except (FileNotFoundError, PermissionError, ValueError, OSError):
        return None


def _get_pss_linux(pid: int) -> int | None:
    """
    Try to get PSS on Linux.
    Priority: smaps_rollup -> smaps -> None
    Returns PSS in bytes, or None if not available.
    """
    # Try smaps_rollup first (lightweight)
    pss = _parse_pss_from_smaps_rollup(pid)
    if pss is not None:
        return pss

    # Fallback to smaps (heavier)
    pss = _parse_pss_from_smaps(pid)
    if pss is not None:
        return pss

    return None


def _get_rss_psutil(pid: int) -> int | None:
    """
    Get RSS using psutil for a single process.
    Returns RSS in bytes, or None if psutil unavailable or process not found.
    """
    if psutil is None:
        return None

    try:
        process = psutil.Process(pid)
        return process.memory_info().rss
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
        return None


def _get_single_process_memory(
    pid: int, prefer_pss: bool = True, use_smaps_rollup_only: bool = False
) -> int | None:
    """
    Get memory usage for a single process (no children).

    Args:
        pid: Process ID
        prefer_pss: If True and on Linux, try PSS first; otherwise use RSS
        use_smaps_rollup_only: If True, only try smaps_rollup (faster), fallback to RSS if not available

    Returns:
        Memory usage in bytes, or None if all methods fail
    """
    if sys.platform == "linux":
        if prefer_pss:
            if use_smaps_rollup_only:
                # Only try smaps_rollup, then fallback to RSS
                pss = _parse_pss_from_smaps_rollup(pid)
                if pss is not None:
                    return pss
            else:
                # Try full PSS (smaps_rollup -> smaps)
                pss = _get_pss_linux(pid)
                if pss is not None:
                    return pss

    # Fallback to RSS
    return _get_rss_psutil(pid)


def get_memory_usage_bytes(
    pid: int | None = None,
    include_children: bool = True,
    prefer_pss: bool = True,
) -> int:
    """
    Get memory usage of a process (and optionally its children).

    On Linux with prefer_pss=True:
      - Tries /proc/<pid>/smaps_rollup first (lightweight)
      - Falls back to /proc/<pid>/smaps if smaps_rollup unavailable (heavier)
      - Falls back to psutil RSS if smaps unavailable

    On non-Linux systems or prefer_pss=False:
      - Uses psutil RSS

    Args:
        pid: Process ID to monitor. If None, uses current process.
        include_children: If True, also includes memory of child processes.
        prefer_pss: If True on Linux, attempts to use PSS; otherwise uses RSS.

    Returns:
        Total memory usage in bytes (guaranteed non-negative).
    """
    if pid is None:
        pid = os.getpid()

    total_memory = 0

    # Determine if we're using smaps (heavier) vs smaps_rollup (lighter)
    use_smaps_rollup_only = False
    if sys.platform == "linux" and prefer_pss:
        # If we can read smaps_rollup, use rollup-only mode
        test_rollup = _parse_pss_from_smaps_rollup(pid)
        use_smaps_rollup_only = test_rollup is not None

    # Get current process memory
    memory = _get_single_process_memory(
        pid, prefer_pss=prefer_pss, use_smaps_rollup_only=use_smaps_rollup_only
    )
    if memory is not None:
        total_memory += memory

    # Get children memory if requested
    if include_children:
        if psutil is None:
            # Cannot get children without psutil
            return total_memory

        try:
            parent_process = psutil.Process(pid)
            children = parent_process.children(recursive=True)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            # Parent process not found or no permission
            return total_memory

        for child in children:
            try:
                child_pid = child.pid
                child_memory = _get_single_process_memory(
                    child_pid,
                    prefer_pss=prefer_pss,
                    use_smaps_rollup_only=use_smaps_rollup_only,
                )
                if child_memory is not None:
                    total_memory += child_memory
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                # Child process died or no permission; skip it
                pass

    return max(0, total_memory)


def get_memory_usage_with_throttle(
    pid: int | None = None,
    include_children: bool = True,
    prefer_pss: bool = True,
    last_pss_check_time: float | None = None,
    pss_throttle_seconds: float = 2.0,
) -> tuple[int, float | None]:
    """
    Get memory usage with throttling for PSS checks on Linux.

    When PSS is not available via smaps_rollup and must read smaps (expensive),
    this throttles checks to at most once per pss_throttle_seconds.

    Args:
        pid: Process ID. If None, uses current process.
        include_children: If True, includes child process memory.
        prefer_pss: If True on Linux, attempts to use PSS.
        last_pss_check_time: Timestamp of last PSS check. For throttling logic.
        pss_throttle_seconds: Minimum interval (seconds) between smaps reads.

    Returns:
        Tuple of (memory_bytes, new_check_time).
        If throttled, returns cached estimate (0) and original check time.
    """
    current_time = time.time()

    # Check if we should throttle
    if (
        prefer_pss
        and sys.platform == "linux"
        and last_pss_check_time is not None
        and (current_time - last_pss_check_time) < pss_throttle_seconds
    ):
        # Throttled: use RSS only as a fast estimate
        memory = 0
        pid_to_check = pid if pid is not None else os.getpid()
        rss = _get_rss_psutil(pid_to_check)
        if rss is not None:
            memory += rss

        if include_children and psutil is not None:
            try:
                parent_process = psutil.Process(pid_to_check)
                for child in parent_process.children(recursive=True):
                    try:
                        child_rss = _get_rss_psutil(child.pid)
                        if child_rss is not None:
                            memory += child_rss
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        return memory, last_pss_check_time

    # Not throttled: do full check
    memory = get_memory_usage_bytes(
        pid=pid, include_children=include_children, prefer_pss=prefer_pss
    )
    return memory, current_time
