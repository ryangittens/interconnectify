<template>
  <v-card @keyup.enter="goToNextGroup" tabindex="0" elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <perfect-scrollbar class="perfectScroll">
        <v-row class="ma-0 question" v-for="(question, index) in currentGroupQuestions" :key="index">
          <v-col cols="12">
            <div class="text-h3 text-medium-emphasis font-weight-bold cursorPointer">
              {{ question.label }}
            </div>
          </v-col>
          <component
            :is="getQuestionComponent(question.type)"
            :question="question"
            :answer="answers[question.key]"
            @answer="handleAnswer"
          />
        </v-row>
      </perfect-scrollbar>

      <div class="text-center mt-2">
        <v-btn @click="goToPreviousGroup" :disabled="groupHistory.length === 0" color="primary" variant="text">
          <ChevronLeftIcon stroke-width="1.5" width="20" />
          Previous
        </v-btn>
        <v-btn @click="goToNextGroup" color="primary" variant="text">
          Next
          <ChevronRightIcon stroke-width="1.5" width="20" />
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import ImageQuestion from './ImageQuestion.vue';
import CheckboxQuestion from './CheckboxQuestion.vue';
import TextQuestion from './TextQuestion.vue';
import { ChevronRightIcon, ChevronLeftIcon } from 'vue-tabler-icons';

// Example question groups with conditional logic
const questionGroups = [
  {
    key: 'serviceType',
    questions: [
      {
        type: 'image',
        label: 'Select your service type:',
        key: 'serviceType',
        options: [
          {
            label: 'Meter Main Combo',
            value: 'meterMainCombo',
            imageUrl:
              'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/meter_main_combo.png?t=2024-10-15T05%3A50%3A19.656Z'
          },
          {
            label: 'Separate Meter',
            value: 'separateMeter',
            imageUrl:
              'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/separate_meter.png?t=2024-10-15T05%3A51%3A15.662Z'
          },
          {
            label: 'Separate Disconnect',
            value: 'separateDisconnect',
            imageUrl:
              'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/separate_disconnect.png?t=2024-10-15T05%3A50%3A56.222Z'
          },
          {
            label: 'Meter Main Disconnect',
            value: 'meterMainDisconnect',
            imageUrl:
              'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/meter_main_disconnect.png?t=2024-10-15T05%3A50%3A38.310Z'
          }
        ]
      }
    ],
    next: (answers) => (answers?.serviceType === 'meterMainCombo' ? 'feedThroughPanel' : 'mainBreakerBusRatings')
  },
  {
    key: 'feedThroughPanel',
    questions: [
      {
        type: 'image',
        label: 'Does it have a feed-through panel?',
        key: 'feedThroughPanel',
        options: [
          { label: 'Yes', value: 'yes', imageUrl: 'https://picsum.photos/200/300?random=5' },
          { label: 'No', value: 'no', imageUrl: 'https://picsum.photos/200/300?random=6' }
        ]
      }
    ],
    next: 'preferredInterconnection'
  },
  {
    key: 'mainBreakerBusRatings',
    questions: [
      { type: 'text', label: 'Enter the main breaker rating', key: 'mainBreakerRating' },
      { type: 'text', label: 'Enter the bus rating', key: 'busRating' }
    ],
    next: 'preferredInterconnection'
  },
  {
    key: 'preferredInterconnection',
    questions: [
      { type: 'text', label: 'Based on your inputs, here is your preferred interconnection:', key: 'interconnection', readonly: true }
    ],
    next: null // End of form
  }
];

const currentGroupIndex = ref(0);
const answers = ref({});
const groupHistory = ref([]);
const currentGroup = computed(() => questionGroups[currentGroupIndex.value]);
const currentGroupQuestions = computed(() => currentGroup.value.questions);

const handleAnswer = ({ key, value }) => {
  answers.value[key] = value;
  goToNextGroup();
};

const goToNextGroup = () => {
  const currentGroupAnswers = currentGroupQuestions.value.reduce((acc, question) => {
    acc[question.key] = answers.value[question.key];
    return acc;
  }, {});

  const nextGroupKey =
    typeof currentGroup.value.next === 'function' ? currentGroup.value.next(currentGroupAnswers) : currentGroup.value.next;

  if (nextGroupKey) {
    const nextGroupIndex = questionGroups.findIndex((group) => group.key === nextGroupKey);
    if (nextGroupIndex !== -1) {
      groupHistory.value.push(currentGroupIndex.value);
      currentGroupIndex.value = nextGroupIndex;
    } else {
      // Handle form submission or go to the result page
    }
  }
};

const goToPreviousGroup = () => {
  if (groupHistory.value.length > 0) {
    currentGroupIndex.value = groupHistory.value.pop();
  }
};

const getQuestionComponent = (type) => {
  switch (type) {
    case 'text':
      return TextQuestion;
    case 'checkbox':
      return CheckboxQuestion;
    case 'image':
      return ImageQuestion;
    default:
      return null;
  }
};
</script>

<style lang="scss" scoped>
.perfectScroll {
  width: 100%;
  height: calc(100vh - 310px);
  min-height: 1077px;
}
</style>
