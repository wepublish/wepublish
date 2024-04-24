<template>
  <nuxt-link :to="{path: '/auth/register', query: {redirectPath: $route.path}}">
    Jetzt registrieren
  </nuxt-link>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'RegisterLink'
})
</script>
