<template>
  <v-row>
    <!-- title -->
    <v-col
      v-if="isRoot"
      id="publicationComments"
      class="col-12 font-size-24 font-size-md-32 font-size-lg-40 abc-semibold px-sm-0"
    >
      Diskussion
    </v-col>

    <!-- create new comment -->
    <v-col
      v-if="isRoot"
      class="col-12 px-sm-0 py-0"
    >
      <!-- no comments -->
      <div
        v-if="comments.comments.length <= 0"
        class="mb-7"
      >
        Dieser Artikel ist noch unkommentiert. Zeit, dich einzubringen.
      </div>

      <v-row>
        <v-col class="col-12">
          <edit-or-create-comment
            :publication-id="publicationId"
            :publication-type="publicationType"
            :comment.sync="newComment"
            @addComment="addComment"
          />
        </v-col>
      </v-row>
    </v-col>

    <!-- comments -->
    <v-col
      v-if="comments.comments.length"
      class="col-12"
      :class="{
        'px-sm-0': isRoot
      }"
    >
      <publication-comment
        v-for="(comment, commentIndex) in comments.comments"
        :key="commentIndex"
        :comment="comment"
        :comment-depth="commentDepth"
        :publication-type="publicationType"
        :publication-id="publicationId"
        class="py-1"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Comments from '~/sdk/wep/models/comment/Comments'
import EditOrCreateComment from '~/components/comment/EditOrCreateComment.vue'
import Comment from '~/sdk/wep/models/comment/Comment'
import PublicationComment from '~/components/comment/PublicationComment.vue'
import { WepPublicationTypeName } from '~/sdk/wep/interfacesAndTypes/WePublish'

export default Vue.extend({
  name: 'PublicationComments',
  components: { PublicationComment, EditOrCreateComment },
  props: {
    commentDepth: {
      type: Number as PropType<number>,
      required: true
    },
    publicationType: {
      type: String as PropType<WepPublicationTypeName>,
      required: true
    },
    publicationId: {
      type: String as PropType<string>,
      required: true
    },
    comments: {
      type: Object as PropType<Comments>,
      required: true
    }
  },
  data () {
    return {
      newComment: undefined as undefined | string
    }
  },
  computed: {
    isRoot (): boolean {
      return this.commentDepth === 0
    }
  },
  methods: {
    addComment (comment: Comment): void {
      this.comments.addComment(comment)
    }
  }
})
</script>
