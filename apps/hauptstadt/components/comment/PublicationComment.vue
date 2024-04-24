<template>
  <v-row>
    <v-col
      class="col-12 abc-light"
      :class="{
        'primary': canHighlight && comment.modifiedAt.isAfter(moment().subtract(6, 's'))
      }"
    >
      <v-row class="justify-space-between no-gutters align-end">
        <v-col class="col-auto font-size-14 zoomable-text">
          <!-- publication date -->
          <div class="caption-12 caption-sm-14 abc-thin zoomable-text">
            {{ comment.modifiedAt.locale('de').format('DD. MMMM YYYY, HH:mm') }}
          </div>
          <!-- user name -->
          <div>{{ comment.user.firstName }} {{ comment.user.name }}</div>
        </v-col>
        <!-- edit my own comment -->
        <v-col
          v-if="canEditComment && false"
          class="col-auto py-0"
        >
          <v-btn
            icon
            class="py-0"
            @click="editComment()"
          >
            <span class="fal fa-pen" />
          </v-btn>
        </v-col>
      </v-row>
      <!-- content -->
      <div
        class="border-top-1px-solid-lightgray font-size-14 zoomable-text"
      >
        <!-- edit existing comment -->
        <edit-or-create-comment
          v-if="showEditComment"
          class="pt-4"
          :edit-comment-id="comment.id"
          :comment.sync="existingComment"
          @cancel="cancelEditComment()"
          @addComment="savedExistingComment"
        />
        <div v-else>
          <!-- misconduct -->
          <div
            v-if="comment.rejectionReason"
            class="mb-4"
          >
            Dieser Beitrag wurde von der Redaktion entfernt. Grund:
            <span v-if="comment.rejectionReason === 'spam'">Spam</span>
            <span v-if="comment.rejectionReason === 'misconduct'">Missachtung Etikette</span>
          </div>
          <!-- content -->
          <div
            v-else
            v-html="commentHtml"
          />

          <!-- own pending approval comment -->
          <v-col
            v-if="comment.state === 'pendingApproval'"
            class="col-auto pl-0 pt-0 mt-n2 pb-4 caption-12 caption-sm-14"
          >
            <span class="fal fa-eye-slash" />
            Dieser Kommentar ist vorerst nur für dich sichtbar, bis er freigegeben wird.
          </v-col>
        </div>
      </div>

      <!-- create new comment -->
      <v-col
        v-if="showCreateComment && !maxCommentDepth"
        class="col-12 pt-0 border-left-1px-solid-black"
      >
        <edit-or-create-comment
          :publication-type="publicationType"
          :publication-id="publicationId"
          :parent-id="comment.id"
          is-reply
          :comment.sync="newComment"
          @cancel="cancelCreateComment()"
          @addComment="addComment"
        />
      </v-col>

      <!-- create answer button and show children button -->
      <v-row
        v-else
        class="font-size-14 no-gutters mt-n2"
      >
        <v-col
          v-if="!maxCommentDepth"
          class="col-auto abc-semi-bold cursor-pointer"
          @click="showCreateComment ? cancelCreateComment() : createComment()"
        >
          <div
            v-if="showCreateComment"
          >
            <span class="fal fa-times mr-1" /> <span class="text-decoration-underline">Antwort abbrechen</span>
          </div>
          <div
            v-else
          >
            <span class="fal fa-reply mr-1" /> <span class="text-decoration-underline">Antworten</span>
          </div>
        </v-col>

        <!-- show children -->
        <!-- uncommented because of https://hauptstadt.atlassian.net/browse/HA-110
        <v-col
          v-if="childrenLength"
          class="col-auto cursor-pointer text-decoration-underline pl-3"
          @click="showChildren = !showChildren"
        >
          <span v-if="showChildren">Antworten ausblenden</span>
          <span v-else>{{ childrenLength }} Antwort<span v-if="childrenLength > 1">en</span> anzeigen</span>
        </v-col> -->
      </v-row>
    </v-col>

    <!-- children -->
    <v-col
      v-if="comment.children.comments && comment.children.comments.length"
      class="col-12 ml-3 pr-0 border-left-1px-solid-black"
    >
      <publication-comments
        style="max-width: 100%;"
        :comments="comment.children"
        :publication-id="publicationId"
        :publication-type="publicationType"
        :comment-depth="commentDepth + 1"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import moment from 'moment'
import Comment from '~/sdk/wep/models/comment/Comment'
import Slate from '~/sdk/wep/classes/Slate'
import EditOrCreateComment from '~/components/comment/EditOrCreateComment.vue'
import User from '~/sdk/wep/models/user/User'
import { WepPublicationTypeName } from '~/sdk/wep/interfacesAndTypes/WePublish'

export default Vue.extend({
  name: 'PublicationComment',
  components: {
    EditOrCreateComment,
    PublicationComments: () => import('./PublicationComments.vue')
  },
  props: {
    comment: {
      type: Object as PropType<Comment>,
      required: true
    },
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
    }
  },
  data () {
    return {
      MAX_COMMENT_DEPTH: 5 as number,
      // showChildren not used at the moment because of https://hauptstadt.atlassian.net/browse/HA-110
      showChildren: false,
      canHighlight: true,
      moment,
      // whether to display or not the textarea
      showCreateComment: false as boolean,
      showEditComment: false as boolean,
      // comment content
      newComment: undefined as undefined | string,
      existingComment: undefined as undefined | string
    }
  },
  computed: {
    commentHtml (): string {
      return new Slate({ fontClassHeadings: '' }).toHtml(this.comment.text || [])
    },
    childrenLength (): number | undefined {
      return this.comment.children?.comments.length
    },
    me (): User | undefined {
      return this.$store.getters['auth/me']
    },
    canEditComment (): boolean {
      return !!this.me && this.me.id === this.comment.user?.id && !this.comment.rejectionReason
    },
    maxCommentDepth (): boolean {
      return this.commentDepth === this.MAX_COMMENT_DEPTH
    }
  },
  mounted () {
    this.controlHighlight()
  },
  methods: {
    addComment (newComment: Comment): void {
      this.showChildren = true
      this.comment.addChild(newComment)
      this.cancelCreateComment()
    },
    savedExistingComment () :void {
      this.cancelEditComment()
      // todo: do not edit prop
      // this.comment = updatedComment
    },
    controlHighlight () {
      setTimeout(() => {
        this.canHighlight = false
      }, 6000)
    },
    /**
     * DISPLAY COMMENT CAPTURING
     */
    createComment (): void {
      this.cancelCreateComment()
      this.showCreateComment = true
    },
    editComment (): void {
      this.cancelCreateComment()
      this.$nuxt.$emit('alert', {
        title: 'Das Bearbeiten eines Kommentars ist derzeit noch nicht möglich. Wir arbeiten daran.',
        type: 'error'
      })

      // todo: uncomment
      // show text area
      // this.showEditComment = true
      // passing existing comment
      // this.existingComment = new Slate({ fontClassHeadings: '' }).toString(this.comment.text)
    },
    /**
     * CANCEL COMMENT CAPTURING
     */
    cancelCreateComment (): void {
      this.showCreateComment = false
      this.newComment = undefined
    },
    cancelEditComment (): void {
      this.showEditComment = false
      this.existingComment = undefined
    }
  }
})
</script>
