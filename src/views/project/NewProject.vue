<script setup lang="ts">
import { ref } from 'vue';
import { Form, useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { supabase } from '@/utils/supabaseClient';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

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
    const { data, error } = await supabase.from('projects').insert({ project_name: values.project_name, user_id: user.id });

    if (error) {
      throw error;
    }

    // Redirect or update UI after successful project creation
    alert('Project created successfully!');
  } catch (error) {
    errors.apiError = error.message;
    console.error('Error creating project:', error.message);
  }
});
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
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
  </v-card>
</template>

<style lang="scss">
.projectForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
