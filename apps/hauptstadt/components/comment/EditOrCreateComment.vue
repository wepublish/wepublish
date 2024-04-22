<template>
  <v-form
    ref="newCommentForm"
    @submit.prevent=""
  >
    <v-row>
      <!-- user is logged in and is able to comment -->
      <v-col
        v-if="$store.getters['auth/loggedIn']"
        class="col-12 pb-5"
      >
        <v-textarea
          :value="comment"
          outlined
          :label="`Beitrag als «${me.firstName} ${me.name}» verfassen`"
          validate-on-blur
          :rules="[
            v => !!v || 'Bitte Text eingeben.',
            v => !!v && v.length <= 1000 || 'Der Kommentar darf nicht länger als 1000 Zeichen sein.'
          ]"
          :counter="1000"
          @input="updateComment"
        />
      </v-col>

      <!-- btn -->
      <v-col
        v-if="$store.getters['auth/loggedIn']"
        class="col-12 pt-0 mt-n2"
      >
        <v-row
          class="justify-space-between mt-n7"
        >
          <!-- cancel -->
          <v-col class="col-auto">
            <v-btn
              v-if="isReply || editCommentId"
              outlined
              small
              tabindex="1"
              @click="$emit('cancel')"
            >
              Abbrechen
            </v-btn>
            <!-- etikette -->
            <nuxt-link
              v-else
              to="/p/unsere-etikette"
              class="caption-12 caption-sm-14"
            >
              Unsere Etikette
            </nuxt-link>
          </v-col>

          <!-- submit -->
          <v-col class="col-auto">
            <v-btn
              elevation="0"
              small
              color="primary"
              :loading="loading"
              tabindex="0"
              @click="saveComment()"
            >
              <span v-if="editCommentId">
                Ändern
              </span>
              <span v-else-if="isReply">
                Antworten
              </span>
              <span v-else>
                Publizieren
              </span>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>

      <!-- user has to login first -->
      <v-col
        v-else
        class="col-12"
      >
        <p>
          Bitte einloggen, um mitzudiskutieren. Falls du kein Login besitzt,
          <nuxt-link to="/p/abo">
            löse gerne eines unserer Abos.
          </nuxt-link>
        </p>
        <!-- login form -->
        <login-form hide-registration />
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import LoginForm from '~/sdk/wep/components/authentication/LoginForm.vue'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'
import CommentService from '~/sdk/wep/services/CommentService'
import Slate, { SlateNode } from '~/sdk/wep/classes/Slate'
import User from '~/sdk/wep/models/user/User'
import { WepPublicationTypeName } from '~/sdk/wep/interfacesAndTypes/WePublish'

export default Vue.extend({
  name: 'EditOrCreateComment',
  components: { LoginForm },
  props: {
    publicationType: {
      type: String as PropType<WepPublicationTypeName | undefined>,
      required: false,
      default: undefined
    },
    publicationId: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    parentId: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    isReply: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    // edit an existing comment
    editCommentId: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    comment: {
      required: true,
      default: undefined
    }
  },
  data () {
    return {
      loading: false as boolean
    }
  },
  computed: {
    me (): User | undefined {
      return this.$store.getters['auth/me']
    }
  },
  methods: {
    async saveComment (): Promise<void> {
      // validate form
      if (!(this.$refs.newCommentForm as VForm).validate() || !this.comment) { return }
      this.loading = true
      // transform textinput into Slate format
      const text: SlateNode[] = new Slate({ fontClassHeadings: '' }).textToSlate(this.comment as unknown as string)
      // mutation
      const commentService: CommentService = new CommentService({ vue: this })

      // whether to update or not
      let comment
      if (this.editCommentId) {
        comment = await commentService.updateComment({
          id: this.editCommentId,
          text
        })
      } else {
        if (!this.publicationId || !this.publicationType) {
          throw new Error('publicationId and publicationType OR editCommentID have to be provided as props.')
        }
        comment = await commentService.createComment({
          parentID: this.parentId,
          itemID: this.publicationId,
          itemType: this.publicationType,
          text
        })
      }
      if (!comment) {
        return
      }
      this.$emit('addComment', comment)
      this.updateComment(undefined)
      this.loading = false
    },
    updateComment (comment): void {
      this.$emit('update:comment', comment)
    }
  }
})
</script>
