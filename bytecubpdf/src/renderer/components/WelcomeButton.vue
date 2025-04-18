<template>
  <button class="welcome-button" @click="handleClick">
    {{ buttonText }}
  </button>
</template>

<script lang="ts" setup>
const props = defineProps({
  buttonText: {
    type: String,
    default: '开始使用'
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}

</script>

<style scoped>
.welcome-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.welcome-button:hover {
  background-color: #2980b9;
}
</style>