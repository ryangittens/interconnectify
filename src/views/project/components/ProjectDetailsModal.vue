<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Form, useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { supabase } from '@/utils/supabaseClient';
import { useAuthStore } from '@/stores/auth';
import { defineProps, defineEmits, ref } from 'vue';

const router = useRouter(); // Use Vue Router

const authStore = useAuthStore();

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['closeProjectDialog']);

const schema = yup.object({
  project_name: yup.string().required('Project Name is required')
});

const { handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    project_name: ''
  }
});

const { value: project_name } = useField('project_name');

const onSubmit = handleSubmit(async (values) => {
  try {
    const user = authStore.user; // Get the logged-in user
    const { data, error } = await supabase.from('projects').insert({ project_name: values.project_name, user_id: user.id }).select('*'); // Ensure to select the inserted record

    if (error) {
      throw error;
    }

    console.log('Inserted project:', data); // Log the inserted data for debugging

    // Navigate to the new project's detail page
    if (data && data.length > 0) {
      router.push({ name: 'ProjectView', params: { id: data[0].id } });
    } else {
      throw new Error('Failed to retrieve the newly created project ID');
    }
  } catch (error) {
    errors.apiError = error.message;
    console.error('Error creating project:', error.message);
  }
});
</script>

<template>
  <v-dialog :model-value="show" @update:model-value="$emit('closeProjectDialog')" width="500">
    <v-card elevation="0" class="innerCard maxWidth">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 mt-1">New Project</h4>
        </div>
        <div class="mt-4">
          <Form @submit="onSubmit" class="mt-7 projectForm">
            <v-text-field
              v-model="project_name"
              label="Project Name"
              required
              density="comfortable"
              hide-details="auto"
              variant="outlined"
              color="primary"
              :error-messages="errors.project_name"
              class="mt-4 mb-8"
            ></v-text-field>
            <v-btn color="primary" :loading="isSubmitting" block class="mt-2" variant="flat" size="large" type="submit">
              Create Project
            </v-btn>
            <div v-if="errors.apiError" class="mt-2">
              <v-alert color="error">{{ errors.apiError }}</v-alert>
            </div>
          </Form>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
.projectForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
