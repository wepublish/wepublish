<template>
  <v-row class="abc-light">
    <v-col
      v-if="directusCrowdfundingId === undefined"
    >
      <v-alert type="error">
        Du musst im Editor ein Property mit dem key "crowdfunding-directus-id" und der entsprechenden Id aus Directus hinzufügen.
      </v-alert>
    </v-col>

    <v-col
      v-else-if="goals && goals.length"
      class="col-12"
    >
      <v-row>
        <!-- how many revenue we got -->
        <v-col class="col-12 pl-4 pl-md-6 lead-20 lead-sm-26">
          Bereits <span class="font-weight-bold">{{ NumberHelper.formatChf(totalRevenue) }} </span> finanziert
        </v-col>
        <!-- list the progress bars -->
        <v-col
          v-for="goal in goalsToShow"
          :key="goal.id"
          class="col-12 pt-0 px-1 px-md-3"
        >
          <v-progress-linear
            :value="calcProgress(goal)"
            color="primary"
            rounded
            height="45px"
          >
            <v-row
              class="align-center"
              no-gutters
            >
              <v-col class="col-2 text-left pl-3">
                <v-menu
                  v-model="menu[goal.id]"
                  :close-on-content-click="false"
                  right
                  :nudge-bottom="35"
                >
                  <template #activator="{ on, attrs }">
                    <v-btn
                      class="mr-2"
                      x-small
                      outlined
                      fab
                      v-bind="attrs"
                      v-on="on"
                    >
                      <span class="fal fa-question" />
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-text>
                      <v-row>
                        <v-col class="col-12">
                          {{ goal.description }}
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col class="col-10 text-right pr-3">
                <v-row no-gutters>
                  <v-col class="col-12 abc-bold">
                    {{ NumberHelper.formatChf(goal.amount) }}
                  </v-col>
                  <v-col
                    class="col-12 mt-n1"
                  >
                    <span class="">{{ goal.title }}</span>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-progress-linear>
        </v-col>
        <!-- show / hide all goals -->
        <v-col
          v-if="goals.length > 1"
          class="col-12 text-right pr-6"
        >
          <v-row
            class="no-gutters justify-end"
          >
            <v-col
              class="col-auto cursor-pointer"
              @click="switchGoals"
            >
              <div>
                <span v-if="showAllGoals">Ziele ausblenden</span>
                <span v-else>Alle Ziele anzeigen</span>
              </div>

              <span v-if="showAllGoals" class="fal fa-chevron-up fa-2x" />
              <span v-else class="fal fa-chevron-down fa-2x" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-col>
    <!-- skeleton loader -->
    <v-col
      v-else
      class="pt-6"
    >
      <v-skeleton-loader
        type="heading"
      />
      <v-skeleton-loader
        class="pt-3"
        type="text"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { Directus } from '@directus/sdk'
import NumberHelper from '../../classes/NumberHelper'
import Crowdfunding, { CrowdfundingType } from '~/sdk/wep-cms/models/crowdfunding/Crowdfunding'
import CrowdfundingGoal from '~/sdk/wep-cms/models/crowdfunding/CrowdfundingGoal'

export default Vue.extend({
  name: 'CrowdfundingBlockView',
  props: {
    directusCrowdfundingId: {
      type: Number as PropType<number>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      crowdfunding: undefined as undefined | Crowdfunding,
      menu: {},
      showAllGoals: false as boolean
    }
  },
  computed: {
    NumberHelper () {
      return NumberHelper
    },
    goals (): CrowdfundingGoal[] {
      return this.crowdfunding?.goals?.goals || []
    },
    goalsToShow (): CrowdfundingGoal[] {
      if (this.showAllGoals) {
        return this.goals
      } else { // only show current video
        const currentGoal: CrowdfundingGoal | undefined = this.goals.find((goal: CrowdfundingGoal) => {
          const progress = this.calcProgress(goal)
          return progress > 0 && progress <= 100
        })
        if (currentGoal) { return [currentGoal] }
        return []
      }
    },
    totalRevenue (): number {
      return this.crowdfunding?.getTotalRevenue() || 0
    }
  },
  async mounted () {
    await this.initialLoad()
  },
  methods: {
    switchGoals (): void {
      this.showAllGoals = !this.showAllGoals
    },
    async initialLoad (): Promise<void> {
      if (!this.directusCrowdfundingId) {
        return
      }
      try {
        const directus = new Directus<CrowdfundingType>(this.$config.WEP_CMS_URL)
        const response = await directus.items('Crowdfunding').readOne(this.directusCrowdfundingId, {
          fields: '*.*',
          filter: {
            status: {
              _eq: 'published'
            }
          },
          deep: {
            goals: {
              _filter: {
                status: {
                  _eq: 'published'
                }
              }
            }
          }
        })
        if (response) {
          this.crowdfunding = new Crowdfunding(response as unknown as CrowdfundingType)
        }
      } catch (e) {
        this.$sentry.captureException(e)
      }
    },
    calcProgress (goal: CrowdfundingGoal): number {
      const goalIndex: number = this.goals.findIndex((tmpGoal: CrowdfundingGoal) => tmpGoal.id === goal.id)
      if (goalIndex <= -1) {
        return 0
      } else if (goalIndex === 0) {
        return this.totalRevenue * 100 / goal.amount
      } else {
        const previousGoal = this.goals[goalIndex - 1]
        const membersToSubtract = this.totalRevenue > previousGoal.amount ? 0 : previousGoal.amount
        return (this.totalRevenue - membersToSubtract) * 100 / (goal.amount - membersToSubtract)
      }
    }
  }
})
</script>
