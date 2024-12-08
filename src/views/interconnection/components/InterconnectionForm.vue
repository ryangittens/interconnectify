<template>
  <v-card @keyup.enter="goToNextGroup" tabindex="0" elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <!-- Wrap the content in a flex container with full height -->
      <perfect-scrollbar class="perfectScroll d-flex flex-column align-center justify-space-around">
        <v-container fluid class="d-flex flex-column align-center justify-space-around">
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
import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();

// Import your interconnection logic and data
import { getInterconnections } from '@/utils/interconnection';
import SummarySection from './SummarySection.vue';
import SelectQuestion from './SelectQuestion.vue';

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
      'https://omjassaddxmfutfrksbh.supabase.co/storage/v1/object/public/static-files/elec-illustrations/elec-illustrations/meter_main_combo.png'
  },
  {
    label: 'Separate MDP',
    value: 'Separate MDP',
    imageUrl:
      'https://omjassaddxmfutfrksbh.supabase.co/storage/v1/object/public/static-files/elec-illustrations/elec-illustrations/separate_meter.png'
  },
  {
    label: 'Separate Disconnect',
    value: 'Separate Disconnect',
    imageUrl:
      'https://omjassaddxmfutfrksbh.supabase.co/storage/v1/object/public/static-files/elec-illustrations/elec-illustrations/separate_disconnect.png'
  },
  {
    label: 'Meter-Main Disconnect',
    value: 'Meter-Main Disconnect',
    imageUrl:
      'https://omjassaddxmfutfrksbh.supabase.co/storage/v1/object/public/static-files/elec-illustrations/elec-illustrations/meter_main_disconnect.png'
  }
];

// Define your question groups
const questionGroups = [
  // {
  //   key: 'inverterMake',
  //   questions: [
  //     {
  //       type: 'image',
  //       label: 'Select your inverter make:',
  //       key: 'inverterMake',
  //       options: inverterMakes,
  //       required: true
  //     }
  //   ],
  //   next: 'inverterModel' // Proceed to inverterModel after make is selected
  // },
  // {
  //   key: 'inverterModel',
  //   questions: [
  //     {
  //       type: 'image',
  //       label: 'Select your inverter model:',
  //       key: 'inverterModel',
  //       required: true
  //       // We'll set the options dynamically based on selected make
  //     }
  //   ],
  //   next: (answers) => {
  //     let inverter = Inverters.find((inv) => inv.value === answers.inverterModel);
  //     if (inverter && inverter.type === 'micro') {
  //       return 'panelCount';
  //     } else {
  //       return 'serviceStyle';
  //     }
  //   }
  // },
  // {
  //   key: 'inverterType',
  //   questions: [
  //     {
  //       type: 'select',
  //       label: 'Select your inverter type:',
  //       key: 'inverterType',
  //       options: [
  //         { title: 'Microinverter', value: 'micro' },
  //         { title: 'String Inverter', value: 'string' },
  //         { title: 'Hybrid Inverter', value: 'hybrid' }
  //       ],
  //       required: true
  //     }
  //   ],
  //   next: 'serviceStyle' // Specify the next group key
  // },
  {
    key: 'inputData',
    questions: [
      { type: 'text', label: 'Enter listed inverter continuous output current:', key: 'inverterCurrent' },
      { type: 'text', label: 'Enter number of inverters:', key: 'numInverters' }
    ],
    next: 'serviceStyle',
    required: true
  },
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
    next: 'mainBreakerBusRatings'
  },

  {
    key: 'mainBreakerBusRatings',
    questions: [
      {
        type: 'select',
        label: 'Main breaker rating (Amps):',
        key: 'mainBreakerRating',
        options: [
          { title: '200A', value: 200 },
          { title: '150A', value: 150 },
          { title: '100A', value: 100 }
        ],
        required: true
      },
      {
        type: 'select',
        label: 'Main bus rating (Amps):',
        key: 'mainBusRating',
        options: [
          { title: '200A', value: 200 },
          { title: '150A', value: 150 },
          { title: '100A', value: 100 }
        ],
        required: true
      }
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
          {
            label: 'Yes',
            value: true,
            imageUrl:
              'https://omjassaddxmfutfrksbh.supabase.co/storage/v1/object/public/static-files/elec-illustrations/elec-illustrations/elec-loadtap-feedthrough-main.png'
          },
          {
            label: 'No',
            value: false,
            imageUrl:
              'https://omjassaddxmfutfrksbh.supabase.co/storage/v1/object/public/static-files/elec-illustrations/elec-illustrations/elec-meter-main-breaker.png'
          }
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

const defaultAnswers = {
  inverterCurrent: '',
  numInverters: '',
  serviceStyle: '',
  mainBreakerRating: 200,
  mainBusRating: 200,
  hasFeedthroughPanel: false,
  feedthroughMainRating: '',
  feedthroughBusRating: '',
  feedthroughConvertible: false,
  breakerSpaceFeedthrough: false,
  breakerSpaceMDP: false,
  newMainBreakerRating: ''
  // Add other keys and default values as needed
};

const answers = ref({ ...defaultAnswers });

const currentGroupIndex = ref(0);
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
  // Validate required questions
  const unansweredRequiredQuestions = currentGroupQuestions.value.filter((question) => {
    const answer = answers.value[question.key];
    return question.required && (answer === undefined || answer === null || answer === '');
  });

  if (unansweredRequiredQuestions.length > 0) {
    // Use snackbar to notify the user
    snackbarStore.showSnackbar('Please answer all required questions before proceeding.', 'error');
    return;
  }

  // Proceed to next group
  const nextGroupKey = typeof currentGroup.value.next === 'function' ? currentGroup.value.next(answers.value) : currentGroup.value.next;

  if (nextGroupKey) {
    const nextGroupIndex = questionGroups.findIndex((group) => group.key === nextGroupKey);
    if (nextGroupIndex !== -1) {
      groupHistory.value.push(currentGroupIndex.value);
      currentGroupIndex.value = nextGroupIndex;
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
    case 'select':
      return SelectQuestion; // Added select type
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
