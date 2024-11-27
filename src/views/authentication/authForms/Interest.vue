<script setup lang="ts">
import { ref } from 'vue';
import { useForm, useField, Form } from 'vee-validate';
import * as yup from 'yup';
import { supabase } from '@/utils/supabaseClient';
import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();

const schema = yup.object({
  email: yup.string().email('E-mail must be valid').required('E-mail is required')
});

const { handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    email: ''
  }
});

const { value: email } = useField('email');

const onSubmit = handleSubmit(async (values) => {
  try {
    const { data, error } = await supabase.from('notifications').insert([{ email: values.email }]);

    if (error) throw error;

    snackbarStore.showSnackbar('Thank you! You will be notified soon.', 'success');
    email.value = '';
  } catch (error: any) {
    snackbarStore.showSnackbar(error.message, 'error');
  }
});
</script>

<template>
  <div class="coming-soon-container">
    <h2 class="text-center mb-4">Coming Soon</h2>
    <p class="text-center mb-6">Enter your email to get notified when the app is ready.</p>
    <Form @submit="onSubmit" class="notification-form">
      <v-text-field
        v-model="email"
        label="Email Address"
        required
        density="comfortable"
        hide-details="auto"
        variant="outlined"
        color="primary"
        :error-messages="errors.email"
      ></v-text-field>
      <v-btn color="primary" :loading="isSubmitting" block type="submit">Notify Me</v-btn>
      <div v-if="errors.apiError" class="mt-2">
        <v-alert color="error">{{ errors.apiError }}</v-alert>
      </div>
    </Form>
  </div>
</template>

<style scoped lang="scss">
.coming-soon-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

.notification-form {
  display: flex;
  flex-direction: column;
}

.v-text-field {
  margin-bottom: 20px;
}
</style>
