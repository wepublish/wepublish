<template>
  <v-col
    class="col-12"
    :class="{
      'max-container-width': $vuetify.breakpoint.xsOnly,
      'max-container-width-sm': $vuetify.breakpoint.smOnly,
      'max-container-width-md': $vuetify.breakpoint.mdOnly,
      'max-container-width-lg': $vuetify.breakpoint.lgOnly,
      'max-container-width-xl': $vuetify.breakpoint.xl
    }"
  >
    <slot />
  </v-col>
</template>

<script>
export default {
  name: 'BoxedContent'
}
</script>
