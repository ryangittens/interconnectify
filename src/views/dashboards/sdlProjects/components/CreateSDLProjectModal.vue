<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Form, useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { supabase } from '@/utils/supabaseClient';
import { useAuthStore } from '@/stores/auth';
import { ref, watch, computed, toRef } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();
const router = useRouter();
const authStore = useAuthStore();
const props = defineProps(['show', 'designs']);
const emit = defineEmits(['closeProjectDialog']);

const schema = yup.object({
  project_name: yup.string().required('Project Name is required')
});

const { handleSubmit, errors, isSubmitting, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    project_name: ''
  }
});

const { value: project_name } = useField('project_name');

// Make 'designs' reactive using toRef
const designs = toRef(props, 'designs');
const selectedDesign = ref(null);

const selectDesign = (design) => {
  selectedDesign.value = design;
  project_name.value = design.design_name; // Prefill the project name
};

const onSubmit = handleSubmit(async (values) => {
  if (!selectedDesign.value) {
    snackbarStore.showSnackbar('Please select a design', 'error');
    return;
  }

  try {
    const user = authStore.user;
    const newProject = {
      project_name: values.project_name,
      user_id: user.id,
      drawing: selectedDesign.value.drawing,
      project_svg: selectedDesign.value.project_svg,
      project_description: selectedDesign.value.project_description || ''
    };

    const { data, error } = await supabase.from('projects').insert(newProject).select('*');

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      router.push({
        name: 'ProjectDesignView',
        params: { id: data[0].id, table: 'projects' }
      });
    } else {
      throw new Error('Failed to retrieve the newly created project ID');
    }
  } catch (error) {
    errors.apiError = error.message;
    snackbarStore.showSnackbar('Error Creating Project', 'error');
  }
});

// Watch for changes to the 'show' prop to reset the form when the dialog closes
watch(
  () => props.show,
  (newVal) => {
    if (!newVal) {
      resetForm();
      selectedDesign.value = null;
      errors.apiError = ''; // Clear the API error message
      errors.project_name = ''; // Clear the project name error
    }
  }
);
</script>

<template>
  <v-dialog :model-value="show" @update:model-value="$emit('closeProjectDialog')" width="500">
    <v-card elevation="0" class="innerCard maxWidth">
      <v-card-text>
        <h4 class="text-h4 mt-1">New Planset From Design</h4>
        <v-list>
          <v-list-subheader>Select Design</v-list-subheader>
          <v-list-item
            v-for="design in designs"
            :key="design.id"
            @click="selectDesign(design)"
            :class="{ 'selected-item': selectedDesign && selectedDesign.project_id === design.project_id }"
          >
            <v-list-item-title class="text-h5">{{ design.design_name }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <Form @submit="onSubmit" class="projectForm mt-3">
          <div class="d-flex align-top">
            <v-text-field
              v-model="project_name"
              label="Project Name"
              :error-messages="errors.project_name"
              required
              :rounded="false"
              class="flex-grow-1"
            ></v-text-field>
            <v-btn
              color="primary"
              :loading="isSubmitting"
              class="ml-2 mt-1"
              variant="text"
              type="submit"
              :disabled="!selectedDesign"
              icon="mdi-send"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>

          <div v-if="errors.apiError" class="mt-2">
            <v-alert color="error">{{ errors.apiError }}</v-alert>
          </div>
        </Form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.selected-item {
  background-color: #e0e0e0;
}

.projectForm .v-text-field .v-field--active input {
  font-weight: 500;
}
</style>
