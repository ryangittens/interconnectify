<script setup lang="ts">
import { ref } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSvgStore } from '@/stores/svgStore';

const svgStore = useSvgStore();
const snackbarStore = useSnackbarStore();

const props = defineProps(['show']);
const emit = defineEmits(['closeImportSvgDialog']);

const svgFile = ref<File | null>(null); // Expecting a single File or null

const svgFileError = ref<string | null>(null);
const errors = ref<{ apiError: string | null }>({ apiError: null });
const isSubmitting = ref(false);

const onSubmit = async (event: Event) => {
  console.log('Form submitted');
  isSubmitting.value = true;
  try {
    console.log('svgFile.value:', svgFile.value); // Log the value

    // Validate the SVG file
    if (!svgFile.value) {
      svgFileError.value = 'SVG file is required';
      throw new Error('SVG file is required');
    } else {
      svgFileError.value = null;
    }

    // Get the file directly
    const file = svgFile.value;

    // Read the SVG file
    const svgContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read the SVG file'));
      };
      reader.readAsText(file);
    });

    // Import the SVG content into the store
    svgStore.importSvgAsBlock(svgContent, event);

    // Emit the event to signal that the action is complete
    emit('closeImportSvgDialog');
  } catch (error: any) {
    console.error('Error during form submission:', error);
    errors.value.apiError = error.message;
    snackbarStore.showSnackbar('Error Importing SVG', 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <v-dialog :model-value="show" @update:model-value="$emit('closeImportSvgDialog')" width="500">
    <v-card elevation="0" class="innerCard maxWidth">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 mt-1">New Block</h4>
        </div>
        <div class="mt-4">
          <form @submit.prevent="onSubmit" class="mt-7 projectForm">
            <v-file-input
              v-model="svgFile"
              label="Upload SVG File"
              accept=".svg"
              required
              :error-messages="svgFileError"
              class="mt-4 mb-8"
            ></v-file-input>
            <v-btn color="primary" :loading="isSubmitting" block class="mt-2" variant="flat" size="large" type="submit"> Import SVG </v-btn>
            <div v-if="errors.apiError" class="mt-2">
              <v-alert color="error">{{ errors.apiError }}</v-alert>
            </div>
          </form>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.projectForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
