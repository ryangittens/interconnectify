<script setup lang="ts">
import { ref } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSvgStore } from '@/stores/svgStore';
import { Helper } from 'dxf'; // Import the Helper class from the dxf library

const svgStore = useSvgStore();
const snackbarStore = useSnackbarStore();

const props = defineProps(['show']);
const emit = defineEmits(['closeImportSvgDialog']);

const importFile = ref<File | null>(null); // Expecting a single File or null

const fileError = ref<string | null>(null);
const errors = ref<{ apiError: string | null }>({ apiError: null });
const isSubmitting = ref(false);

const onSubmit = async (event: Event) => {
  isSubmitting.value = true;
  try {
    // Validate the file
    if (!importFile.value) {
      fileError.value = 'File is required';
      throw new Error('File is required');
    } else {
      fileError.value = null;
    }

    const file = importFile.value;

    // Read the file content
    const fileContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };
      reader.readAsText(file);
    });

    // Check the file type based on the extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'svg') {
      // Import the SVG content into the store
      svgStore.importSvgAsBlock(fileContent, event);
    } else if (fileExtension === 'dxf') {
      // Parse the DXF content and convert it to SVG
      const helper = new Helper(fileContent);
      const svgContent = helper.toSVG();

      // Import the SVG content into the store
      svgStore.importSvgAsBlock(svgContent, event);
    } else {
      fileError.value = 'Unsupported file type';
      throw new Error('Unsupported file type');
    }

    // Emit the event to signal that the action is complete
    emit('closeImportSvgDialog');
  } catch (error: any) {
    console.error('Error during file import:', error);
    errors.value.apiError = error.message;
    snackbarStore.showSnackbar('Error Importing File', 'error');
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
              v-model="importFile"
              label="Upload SVG or DXF File"
              accept=".svg,.dxf"
              required
              :error-messages="fileError"
              class="mt-4 mb-8"
            ></v-file-input>
            <v-btn color="primary" :loading="isSubmitting" block class="mt-2" variant="flat" size="large" type="submit">
              Import File
            </v-btn>
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
