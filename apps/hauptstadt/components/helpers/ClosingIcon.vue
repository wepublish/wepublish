<template>
  <div :style="{height: `${size / 2}px`}">
    <div
      class="closing-border"
      style="transform: rotate(45deg);"
      :style="{width: `${size}px`, marginTop: `${size/2}px`}"
    />
    <div
      class="closing-border"
      style="transform: rotate(-45deg); margin-top: -2px;"
      :style="{width: `${size}px`}"
    />
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

export default Vue.extend({
  name: 'ClosingIcon',
  props: {
    size: {
      type: Number as PropType<number>,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.closing-border {
  border: 1px solid black;
}
</style>
