<template>
  <article-slug
    :token="$route.params.ArticlePreviewToken"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import ArticleSlug from '~/pages/a/_ArticleSlug.vue'
export default Vue.extend({
  name: 'ArticlePreviewToken',
  components: { ArticleSlug }
})
</script>
