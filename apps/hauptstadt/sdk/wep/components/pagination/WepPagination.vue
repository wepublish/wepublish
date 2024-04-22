<template>
  <v-row
    v-if="pagination"
    class="justify-center align-center font-size-20 font-size-md-24"
  >
    <v-col class="col-12">
      <v-pagination
        :value="pagination.currentPage"
        :length="pagination.totalPages"
        :total-visible="7"
        color="black"
        circle
        @input="(page) => goToPage(page)"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Pagination from '~/sdk/wep/models/wepPublication/Pagination'

export default Vue.extend({
  name: 'WepPagination',
  props: {
    pagination: {
      type: Object as PropType<Pagination>,
      required: true
    }
  },
  methods: {
    goToPage (page: number): void {
      if (page >= 0 && page <= this.pagination.totalPages) {
        this.$emit('goToPage', page)
      }
    }
  }
})
</script>
