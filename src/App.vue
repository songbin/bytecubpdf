<template>
  <Layout />
</template>

<script>
import Layout from '@/layouts/GlobalLayout.vue';

export default {
  name: 'App',
  components: {
    Layout
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.t-layout {
  min-height: 100vh;
}
</style>