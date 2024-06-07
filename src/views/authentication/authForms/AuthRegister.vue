<script setup lang="ts">
import { ref } from 'vue';
import Google from '@/assets/images/auth/social-google.svg';
import { useAuthStore } from '@/stores/auth';
import { Form, useField, useForm } from 'vee-validate';
import * as yup from 'yup';

const authStore = useAuthStore();
const show1 = ref(false);

const schema = yup.object({
  firstname: yup.string().required('First name is required'),
  lastname: yup.string().required('Last name is required'),
  email: yup.string().email('E-mail must be valid').required('E-mail is required'),
  password: yup.string().required('Password is required').max(10, 'Password must be less than 10 characters'),
  checkbox: yup.bool().oneOf([true], 'You must agree to continue!')
});

const { handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    checkbox: false
  }
});

const { value: firstname } = useField('firstname');
const { value: lastname } = useField('lastname');
const { value: email } = useField('email');
const { value: password } = useField('password');
const { value: checkbox } = useField('checkbox');

const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.register(values.email, values.password);
  } catch (error) {
    errors.apiError = error.message;
  }
});
</script>

<template>
  <v-btn block color="primary" variant="outlined" class="text-lightText googleBtn">
    <img :src="Google" alt="google" />
    <span class="ml-2">Sign up with Google</span>
  </v-btn>
  <v-row>
    <v-col class="d-flex align-center">
      <v-divider class="custom-devider" />
      <v-btn variant="outlined" class="orbtn" rounded="md" size="small">OR</v-btn>
      <v-divider class="custom-devider" />
    </v-col>
  </v-row>
  <h5 class="text-h5 text-center my-4 mb-8">Sign up with Email address</h5>
  <Form @submit="onSubmit" class="mt-7 loginForm">
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="firstname"
          label="Firstname"
          density="comfortable"
          hide-details="auto"
          variant="outlined"
          color="primary"
          :error-messages="errors.firstname"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="lastname"
          label="Lastname"
          density="comfortable"
          hide-details="auto"
          variant="outlined"
          color="primary"
          :error-messages="errors.lastname"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-text-field
      v-model="email"
      label="Email Address / Username"
      class="mt-4 mb-4"
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

    <div class="d-sm-inline-flex align-center mt-2 mb-7 mb-sm-0 font-weight-bold">
      <v-checkbox
        v-model="checkbox"
        label="Agree with?"
        required
        color="primary"
        class="ms-n2"
        hide-details
        :error-messages="errors.checkbox"
      ></v-checkbox>
      <a href="#" class="ml-1 text-lightText">Terms and Condition</a>
    </div>
    <v-btn color="secondary" :loading="isSubmitting" block class="mt-2" variant="flat" size="large" type="submit"> Sign Up </v-btn>
    <div v-if="errors.apiError" class="mt-2">
      <v-alert color="error">{{ errors.apiError }}</v-alert>
    </div>
  </Form>
  <div class="mt-5 text-right">
    <v-divider />
    <v-btn variant="plain" to="/auth/login" class="mt-2 text-capitalize mr-n2">Already have an account?</v-btn>
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
