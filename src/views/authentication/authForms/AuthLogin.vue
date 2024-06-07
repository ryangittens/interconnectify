<script setup lang="ts">
import { ref } from 'vue';
import Google from '@/assets/images/auth/social-google.svg';
import { useAuthStore } from '@/stores/auth';
import { Form, useField, useForm } from 'vee-validate';
import * as yup from 'yup';

const authStore = useAuthStore();
const show1 = ref(false);

const schema = yup.object({
  email: yup.string().email('E-mail must be valid').required('E-mail is required'),
  password: yup.string().required('Password is required').max(10, 'Password must be less than 10 characters')
});

const { handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
    password: ''
  }
});

const { value: email } = useField('email');
const { value: password } = useField('password');

const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.login(values.email, values.password);
  } catch (error) {
    if (error.message.includes('Invalid login credentials')) {
      errors.apiError = 'User not found or incorrect password';
    } else {
      errors.apiError = error.message;
    }
  }
});
</script>

<template>
  <v-btn block color="primary" variant="outlined" class="text-lightText googleBtn">
    <img :src="Google" alt="google" />
    <span class="ml-2">Sign in with Google</span>
  </v-btn>
  <v-row>
    <v-col class="d-flex align-center">
      <v-divider class="custom-devider" />
      <v-btn variant="outlined" class="orbtn" rounded="md" size="small">OR</v-btn>
      <v-divider class="custom-devider" />
    </v-col>
  </v-row>
  <h5 class="text-h5 text-center my-4 mb-8">Sign in with Email address</h5>
  <Form @submit="onSubmit" class="mt-7 loginForm">
    <v-text-field
      v-model="email"
      label="Email Address / Username"
      class="mt-4 mb-8"
      required
      density="comfortable"
      hide-details="auto"
      variant="outlined"
      color="primary"
      :error-messages="errors.email"
    ></v-text-field>
    <v-text-field
      v-model="password"
      label="Password"
      required
      density="comfortable"
      variant="outlined"
      color="primary"
      hide-details="auto"
      :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
      :type="show1 ? 'text' : 'password'"
      @click:append="show1 = !show1"
      class="pwdInput"
      :error-messages="errors.password"
    ></v-text-field>
    <v-btn color="secondary" :loading="isSubmitting" block class="mt-2" variant="flat" size="large" type="submit"> Sign In </v-btn>
    <div v-if="errors.apiError" class="mt-2">
      <v-alert color="error">{{ errors.apiError }}</v-alert>
    </div>
  </Form>
  <div class="mt-5 text-right">
    <v-divider />
    <v-btn variant="plain" to="/auth/register" class="mt-2 text-capitalize mr-n2">Don't Have an account?</v-btn>
  </div>
</template>

<style lang="scss">
.custom-devider {
  border-color: rgba(0, 0, 0, 0.08) !important;
}
.googleBtn {
  border-color: rgba(0, 0, 0, 0.08);
  margin: 30px 0 20px 0;
}
.outlinedInput .v-field {
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: none;
}
.orbtn {
  padding: 2px 40px;
  border-color: rgba(0, 0, 0, 0.08);
  margin: 20px 15px;
}
.pwdInput {
  position: relative;
  .v-input__append {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
}
.loginForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
