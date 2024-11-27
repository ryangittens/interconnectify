<template>
  <v-card @keyup.enter="goToNextGroup" tabindex="0" elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <!-- Wrap the content in a flex container with full height -->
      <perfect-scrollbar class="perfectScroll">
        <v-container fluid class="d-flex align-center justify-center" style="height: 100%">
          <v-row class="my-auto question" v-for="(question, index) in currentGroupQuestions" :key="index" justify="center">
            <!-- Question Label -->
            <v-col cols="12">
              <div class="text-h3 text-medium-emphasis font-weight-bold cursorPointer text-center">
                {{ question.label }}
              </div>
            </v-col>
            <!-- Question Component -->
            <component
              :is="getQuestionComponent(question.type)"
              :question="question"
              :answer="answers[question.key]"
              @answer="handleAnswer"
            />
          </v-row>
        </v-container>
      </perfect-scrollbar>
    </v-card-text>

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
  </v-card>
  <summary-section :answers="answers" :inverter-options="Inverters" :service-style-options="serviceStyleOptions" />
</template>

<script setup>
import { ref, computed } from 'vue';
import ImageQuestion from './ImageQuestion.vue';
import CheckboxQuestion from './CheckboxQuestion.vue';
import TextQuestion from './TextQuestion.vue';
import InterconnectionQuestion from './InterconnectionQuestion.vue'; // New component
import { ChevronRightIcon, ChevronLeftIcon } from 'vue-tabler-icons';
import { Inverters } from '@/utils/inverters';

// Import your interconnection logic and data
import { getInterconnections } from '@/utils/interconnection';
import SummarySection from './SummarySection.vue';

const inverterOptions = Inverters;

const inverterMakes = [
  { label: 'ENPHASE', value: 'ENPHASE', imageUrl: 'https://example.com/make_a.png' },
  { label: 'SOLAREDGE', value: 'SOLAREDGE', imageUrl: 'https://example.com/make_b.png' }
  // ... add more makes
];

const serviceStyleOptions = [
  {
    label: 'Meter-Main Combo',
    value: 'Meter-Main Combo',
    imageUrl:
      'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/meter_main_combo.png?t=2024-10-15T05%3A50%3A19.656Z'
  },
  {
    label: 'Separate MDP',
    value: 'Separate MDP',
    imageUrl:
      'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/separate_meter.png?t=2024-10-15T05%3A51%3A15.662Z'
  },
  {
    label: 'Separate Disconnect',
    value: 'Separate Disconnect',
    imageUrl:
      'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/separate_disconnect.png?t=2024-10-15T05%3A50%3A56.222Z'
  },
  {
    label: 'Meter-Main Disconnect',
    value: 'Meter-Main Disconnect',
    imageUrl:
      'https://yjacdiyfzruzjjafekzd.supabase.co/storage/v1/object/public/electrical_illustrations/meter_main_disconnect.png?t=2024-10-15T05%3A50%3A38.310Z'
  }
];

// Define your question groups
const questionGroups = [
  {
    key: 'serviceStyle',
    questions: [
      {
        type: 'image',
        label: 'Select your service type:',
        key: 'serviceStyle',
        options: serviceStyleOptions
      }
    ],
    next: 'panelCount'
  },
  {
    key: 'panelCount',
    questions: [{ type: 'text', label: 'Enter the panel count:', key: 'panelCount' }],
    next: 'inverterMake'
  },
  {
    key: 'inverterMake',
    questions: [
      {
        type: 'image',
        label: 'Select your inverter make:',
        key: 'inverterMake',
        options: inverterMakes
      }
    ],
    next: 'inverterModel' // Proceed to inverterModel after make is selected
  },
  {
    key: 'inverterModel',
    questions: [
      {
        type: 'image',
        label: 'Select your inverter model:',
        key: 'inverterModel'
        // We'll set the options dynamically based on selected make
      }
    ],
    next: 'mainBreakerBusRatings'
  },
  {
    key: 'mainBreakerBusRatings',
    questions: [
      { type: 'text', label: 'Enter the main breaker rating (Amps):', key: 'mainBreakerRating' },
      { type: 'text', label: 'Enter the main bus rating (Amps):', key: 'mainBusRating' }
    ],
    next: (answers) => {
      if (answers.serviceStyle === 'Meter-Main Combo' || answers.serviceStyle === 'Meter-Main Disconnect') {
        return 'feedThroughPanel';
      } else {
        return 'breakerSpaceMDP';
      }
    }
  },
  {
    key: 'feedThroughPanel',
    questions: [
      {
        type: 'image',
        label: 'Does it have a feed-through panel?',
        key: 'hasFeedthroughPanel',
        options: [
          { label: 'Yes', value: true, imageUrl: 'https://picsum.photos/200/300?random=5' },
          { label: 'No', value: false, imageUrl: 'https://picsum.photos/200/300?random=6' }
        ]
      }
    ],
    next: (answers) => {
      if (answers.hasFeedthroughPanel) {
        return 'feedthroughMainBusRatings';
      } else {
        return 'breakerSpaceMDP';
      }
    }
  },
  {
    key: 'feedthroughMainBusRatings',
    questions: [
      { type: 'text', label: 'Enter the feedthrough main rating (Amps):', key: 'feedthroughMainRating' },
      { type: 'text', label: 'Enter the feedthrough bus rating (Amps):', key: 'feedthroughBusRating' }
    ],
    next: 'feedthroughConvertible'
  },
  {
    key: 'feedthroughConvertible',
    questions: [
      {
        type: 'checkbox',
        label: 'Is the feedthrough convertible?',
        key: 'feedthroughConvertible',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    next: 'breakerSpaceFeedthrough'
  },
  {
    key: 'breakerSpaceFeedthrough',
    questions: [
      {
        type: 'checkbox',
        label: 'Is there breaker space in the feedthrough panel?',
        key: 'breakerSpaceFeedthrough',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    next: 'breakerSpaceMDP'
  },
  {
    key: 'breakerSpaceMDP',
    questions: [
      {
        type: 'checkbox',
        label: 'Is there breaker space in the main distribution panel (MDP)?',
        key: 'breakerSpaceMDP',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    next: 'newMainBreakerRating'
  },
  {
    key: 'newMainBreakerRating',
    questions: [{ type: 'text', label: 'Enter the new main breaker rating (if applicable):', key: 'newMainBreakerRating' }],
    next: 'preferredInterconnection'
  },
  {
    key: 'preferredInterconnection',
    questions: [
      {
        type: 'interconnection',
        label: 'Based on your inputs, here are your preferred interconnection options:',
        key: 'interconnectionOptions',
        readonly: true
      }
    ],
    next: null // End of form
  }
];

const currentGroupIndex = ref(0);
const answers = ref({});
const groupHistory = ref([]);

const currentGroupQuestions = computed(() => {
  const group = questionGroups[currentGroupIndex.value];

  // If the current group is 'inverterModel', filter the options
  if (group.key === 'inverterModel') {
    const selectedMake = answers.value.inverterMake;
    const filteredInverters = Inverters.filter((inverter) => inverter.make === selectedMake);

    const updatedQuestions = group.questions.map((question) => {
      if (question.key === 'inverterModel') {
        return {
          ...question,
          options: filteredInverters.map((inverter) => ({
            label: inverter.label,
            value: inverter.value,
            imageUrl: inverter.imageUrl
          }))
        };
      }
      return question;
    });

    return updatedQuestions;
  }

  return group.questions;
});

const currentGroup = computed(() => questionGroups[currentGroupIndex.value]);

// Compute the interconnection options when in the preferredInterconnection group
const interconnectionOptions = computed(() => {
  if (currentGroup.value.key !== 'preferredInterconnection') return [];
  const data = {
    panelCount: parseInt(answers.value.panelCount, 10),
    inverterModel: answers.value.inverterModel,
    serviceStyle: answers.value.serviceStyle,
    mainBreakerRating: parseInt(answers.value.mainBreakerRating, 10),
    mainBusRating: parseInt(answers.value.mainBusRating, 10),
    feedthroughMainRating: parseInt(answers.value.feedthroughMainRating, 10),
    feedthroughBusRating: parseInt(answers.value.feedthroughBusRating, 10),
    breakerSpaceMDP: answers.value.breakerSpaceMDP === true || answers.value.breakerSpaceMDP === 'true',
    breakerSpaceFeedthrough: answers.value.breakerSpaceFeedthrough === true || answers.value.breakerSpaceFeedthrough === 'true',
    newMainBreakerRating: parseInt(answers.value.newMainBreakerRating, 10),
    feedthroughConvertible: answers.value.feedthroughConvertible === true || answers.value.feedthroughConvertible === 'true'
  };
  return getInterconnections(data);
});

const handleAnswer = ({ key, value }) => {
  answers.value[key] = value;
  // Only proceed to the next group if not in the preferredInterconnection group
  if (currentGroup.value.next) {
    goToNextGroup();
  }
};

const goToNextGroup = () => {
  const nextGroupKey = typeof currentGroup.value.next === 'function' ? currentGroup.value.next(answers.value) : currentGroup.value.next;

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
    case 'interconnection':
      return InterconnectionQuestion;
    default:
      return null;
  }
};
</script>

<style lang="scss" scoped>
.perfectScroll {
  width: 100%;
  height: calc(100vh - 400px);
}
</style>
