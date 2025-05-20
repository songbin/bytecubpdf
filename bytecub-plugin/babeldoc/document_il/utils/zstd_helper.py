import base64

import pyzstd


def zstd_compress(data) -> str:
    if isinstance(data, str):
        data = data.encode()
    if not isinstance(data, bytes):
        raise TypeError(f"data must be str or bytes, not {type(data)}")

    return base64.b85encode(pyzstd.compress(data)).decode()


def zstd_decompress(data) -> str:
    if isinstance(data, str):
        data = data.encode()
    if not isinstance(data, bytes):
        raise TypeError(f"data must be str or bytes, not {type(data)}")

    return pyzstd.decompress(base64.b85decode(data)).decode()
