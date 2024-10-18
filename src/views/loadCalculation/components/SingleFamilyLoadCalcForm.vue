<template>
  <v-card elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-4">
        <h4 class="text-h4">Dwelling Unit Service Load Calculation – Standard Method</h4>
      </div>
      <v-form v-model="valid">
        <perfect-scrollbar class="perfectScroll">
          <v-row class="ma-0">
            <v-col class="pl-0">
              <!-- Property Data -->
              <v-card-title class="d-flex justify-space-between align-center"> Property Data </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row>
                  <v-col cols="12" class="py-0">
                    <v-text-field class="mr-3" label="Property Address" v-model="address" variant="outlined"></v-text-field>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6" class="py-0">
                    <v-select
                      class="mr-3"
                      :items="voltageOptions"
                      label="Voltage"
                      v-model="propertyData.voltage"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <v-text-field
                      class="mr-3"
                      label="Living Floor Area (sqft)"
                      v-model.number="propertyData.squareFootage"
                      variant="outlined"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>

              <div v-show="propertyData.squareFootage">
                <!-- General Load Section -->
                <v-card-title class="d-flex justify-space-between align-center"> General Load </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row v-for="(item, index) in generalLoadItems" :key="index" class="align-center">
                    <!-- Name Column -->
                    <v-col class="py-0" cols="5">
                      <v-text-field label="Name" v-model="item.name" variant="outlined" :readonly="item.readonly"></v-text-field>
                    </v-col>
                    <!-- Quantity Column -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        :label="'Quantity' + (item.units ? ' (' + item.units + ')' : '')"
                        v-model.number="item.quantity"
                        type="number"
                        variant="outlined"
                        :rules="getQuantityRules(item)"
                      ></v-text-field>
                    </v-col>
                    <!-- VA per Unit Column -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        min="0"
                        label="VA per Unit"
                        v-model.number="item.va"
                        type="number"
                        variant="outlined"
                        :rules="getVARules(item)"
                        :readonly="item.readonly"
                      ></v-text-field>
                    </v-col>
                    <!-- Total VA Column -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="Total VA"
                        :value="calculateItemTotalVA(item)"
                        type="number"
                        variant="plain"
                        readonly
                        placeholder="0"
                        persistent-placeholder
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeGeneralLoadItem(item)" v-if="!item.readonly">mdi-delete</v-icon>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" class="d-flex justify-end align-center">
                      <!-- <v-btn small color="primary" variant="tonal" @click="addGeneralLoadItem">Add Item</v-btn> -->
                      <p class="font-weight-bold">Total General Load: {{ calculateGeneralLoad() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- Fixed Appliances Section -->
                <v-card-title class="d-flex justify-space-between align-center"> Fixed Appliances </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row v-for="(item, index) in fixedAppliances" :key="index" class="align-center">
                    <!-- Appliance Name -->
                    <v-col class="py-0" cols="5">
                      <v-text-field label="Appliance" v-model="item.name" variant="outlined" readonly></v-text-field>
                    </v-col>
                    <!-- Quantity -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined" min="1"></v-text-field>
                    </v-col>
                    <!-- VA per Unit -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="VA per Unit" v-model.number="item.va" type="number" variant="outlined" min="0"></v-text-field>
                    </v-col>
                    <!-- Total VA -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="Total VA"
                        :value="calculateItemTotalVA(item)"
                        type="number"
                        variant="plain"
                        readonly
                        placeholder="0"
                        persistent-placeholder
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeFixedAppliance(item)">mdi-delete</v-icon>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" class="d-flex justify-space-between align-center">
                      <v-btn small color="primary" variant="tonal" @click="openApplianceModal('Fixed Appliance')">Add Appliance</v-btn>
                      <p class="font-weight-bold">Total Fixed Appliances Load: {{ calculateFixedAppliancesLoad() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- Dryer Section (Modified) -->
                <v-card-title class="d-flex justify-space-between align-center"> Dryer </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row v-for="(item, index) in dryerItems" :key="index" class="align-center">
                    <!-- Dryer Name -->
                    <v-col class="py-0" cols="5">
                      <v-text-field label="Dryer Name" v-model="item.name" variant="outlined"></v-text-field>
                    </v-col>
                    <!-- Quantity -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined" min="1"></v-text-field>
                    </v-col>
                    <!-- VA per Unit -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="VA per Unit"
                        v-model.number="item.va"
                        type="number"
                        variant="outlined"
                        :rules="getVARules(item)"
                        min="5000"
                      ></v-text-field>
                    </v-col>
                    <!-- Total VA -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="Total VA"
                        :value="calculateDryerItemTotalVA(item)"
                        type="number"
                        variant="plain"
                        readonly
                        persistent-placeholder
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeDryerItem(item)">mdi-delete</v-icon>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" class="d-flex justify-space-between align-center">
                      <v-btn small color="primary" variant="tonal" @click="openApplianceModal('Dryer')">Add Dryer</v-btn>
                      <p class="font-weight-bold">Total Dryer Load: {{ calculateDryerLoad() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- Cooking Equipment Section -->
                <!-- [Cooking Equipment Section remains unchanged] -->
                <v-card-title class="d-flex justify-space-between align-center"> Cooking Equipment </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row v-for="(item, index) in cookingEquipmentItems" :key="index" class="align-center">
                    <!-- Appliance Name -->
                    <v-col class="py-0" cols="5">
                      <v-text-field label="Appliance Name" v-model="item.name" variant="outlined"></v-text-field>
                    </v-col>
                    <!-- Quantity -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined" min="1"></v-text-field>
                    </v-col>
                    <!-- VA Rating -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="VA Rating per Unit"
                        v-model.number="item.va"
                        type="number"
                        variant="outlined"
                        min="0"
                      ></v-text-field>
                    </v-col>
                    <!-- Total VA -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="Total VA"
                        :value="calculateItemTotalVA(item)"
                        type="number"
                        variant="plain"
                        readonly
                        persistent-placeholder
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeCookingEquipmentItem(item)">mdi-delete</v-icon>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" class="d-flex justify-space-between align-center">
                      <v-btn small color="primary" variant="tonal" @click="openApplianceModal('Cooking Equipment')">Add Equipment</v-btn>
                      <p class="font-weight-bold">Cooking Equipment Load: {{ calculateCookingEquipmentLoad() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- HVAC Load Section -->
                <!-- [HVAC Load Section remains unchanged] -->
                <v-card-title class="d-flex justify-space-between align-center"> HVAC (Heating or A/C) </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row v-for="(item, index) in hvacLoadOptions" :key="index" class="align-center">
                    <!-- Label Column -->
                    <v-col class="py-0" cols="5">
                      <v-text-field label="Name" v-model="item.name" variant="outlined"></v-text-field>
                    </v-col>
                    <!-- Quantity Column -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined" min="1"></v-text-field>
                    </v-col>
                    <!-- VA per Unit Column -->
                    <v-col class="py-0" cols="2">
                      <v-text-field min="0" label="VA per Unit" v-model.number="item.va" type="number" variant="outlined"></v-text-field>
                    </v-col>
                    <!-- Total VA Column -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="Total VA"
                        :value="calculateItemTotalVA(item)"
                        type="number"
                        variant="plain"
                        readonly
                        placeholder="0"
                        persistent-placeholder
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeHVACLoadItem(item)">mdi-delete</v-icon>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" class="d-flex justify-space-between align-center">
                      <v-btn small color="primary" variant="tonal" @click="openApplianceModal('HVAC')">Add Equipment</v-btn>
                      <p class="font-weight-bold">Total HVAC Load: {{ calculateHVACLoad() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- Other Loads Section -->
                <!-- [Other Loads Section remains unchanged] -->
                <v-card-title class="d-flex justify-space-between align-center"> Other Loads </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row v-for="(item, index) in otherLoads" :key="index" class="align-center">
                    <!-- Load Name -->
                    <v-col class="py-0" cols="5">
                      <v-text-field label="Load Name" v-model="item.name" variant="outlined"></v-text-field>
                    </v-col>
                    <!-- Quantity -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined" min="1"></v-text-field>
                    </v-col>
                    <!-- VA per Unit -->
                    <v-col class="py-0" cols="2">
                      <v-text-field label="VA per Unit" v-model.number="item.va" type="number" variant="outlined" min="0"></v-text-field>
                    </v-col>
                    <!-- Total VA -->
                    <v-col class="py-0" cols="2">
                      <v-text-field
                        label="Total VA"
                        :value="calculateItemTotalVA(item)"
                        type="number"
                        variant="plain"
                        readonly
                        placeholder="0"
                        persistent-placeholder
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeOtherLoad(item)">mdi-delete</v-icon>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" class="d-flex justify-space-between align-center">
                      <v-btn small color="primary" variant="tonal" @click="openApplianceModal('Other')">Add Equipment</v-btn>
                      <p class="font-weight-bold">Total Other Loads: {{ calculateOtherLoads() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- Largest Motor Section -->
                <!-- [Largest Motor Section remains unchanged] -->
                <v-card-title class="d-flex justify-space-between align-center"> Largest Motor </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-row class="align-center">
                    <!-- Motor VA -->
                    <v-col class="py-0" cols="11">
                      <v-text-field
                        label="Largest Motor VA"
                        v-model.number="largestMotor.va"
                        type="number"
                        variant="outlined"
                        min="0"
                      ></v-text-field>
                    </v-col>
                    <!-- Delete Icon -->
                    <v-col cols="1" class="text-center mb-5">
                      <v-icon small @click="removeLargestMotor">mdi-delete</v-icon>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" class="d-flex justify-end align-center">
                      <p class="font-weight-bold">Largest Motor Load (25%): {{ calculateLargestMotorLoad() }} VA</p>
                    </v-col>
                  </v-row>
                </v-card-text>
              </div>
            </v-col>
          </v-row>
        </perfect-scrollbar>
      </v-form>
    </v-card-text>
  </v-card>
  <!-- Appliance Modal -->
  <v-dialog v-model="showApplianceModal" max-width="500px">
    <v-card>
      <v-card-title>Select or Add Appliance</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-form ref="applianceForm">
          <!-- Appliance Selection -->
          <v-radio-group v-model="newAppliance.option" @change="onApplianceOptionChange">
            <v-radio label="Select from predefined appliances" value="predefined"></v-radio>
            <v-radio label="Add custom appliance" value="custom"></v-radio>
          </v-radio-group>

          <v-container v-if="newAppliance.option === 'predefined'" class="pa-0">
            <v-select
              :items="filteredAppliances"
              item-text="title"
              label="Select Appliance"
              v-model="selectedAppliance"
              @update:modelValue="onPredefinedApplianceSelected"
              :clearable="false"
              return-object
              variant="underlined"
            ></v-select>
          </v-container>

          <!-- Custom Appliance Inputs -->
          <v-container v-else-if="newAppliance.option === 'custom'" class="pa-0">
            <v-text-field label="Appliance Name" v-model="newAppliance.name" required variant="underlined"></v-text-field>
            <v-text-field
              v-if="currentSection === 'Cooking Equipment'"
              label="VA Rating per Unit"
              v-model.number="newAppliance.va"
              type="number"
              required
              variant="underlined"
            ></v-text-field>
            <v-text-field
              v-else
              label="VA per Unit"
              v-model.number="newAppliance.va"
              type="number"
              required
              variant="underlined"
            ></v-text-field>
            <v-row>
              <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                <template v-if="currentSection != 'Cooking Equipment'">
                  <v-checkbox v-model="newAppliance.isMotor" label="Is Motor"></v-checkbox>
                </template>
                <template v-if="currentSection == 'HVAC'">
                  <v-checkbox v-model="newAppliance.heating" label="Cooling"></v-checkbox>
                  <v-checkbox v-model="newAppliance.cooling" label="Heating"></v-checkbox>
                </template>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeApplianceModal">Cancel</v-btn>
        <v-btn color="primary" text @click="addAppliance">Add Appliance</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Final Calculation -->
  <v-card elevation="0" class="innerCard maxWidth">
    <div class="mt-2">
      <!-- Final Load Calculation -->
      <v-card-title>Final Calculation</v-card-title>
      <v-card-text style="min-height: 84px">
        <div v-show="propertyData.squareFootage">
          <v-row class="d-flex justify-space-between align-center">
            <v-col class="py-0">
              <!-- <p>Total Calculated Load: {{ calculateTotalLoad() }} VA</p> -->
              <p>Calculated Amperage: {{ calculateAmperage() }} A</p>
              <p>
                <!-- <b>Main Breaker Size: {{ getStandardBreakerSize(calculateAmperage()) }} A</b> -->
                <v-text-field
                  class="mt-2"
                  label="Main Breaker Size"
                  type="number"
                  variant="underlined"
                  v-model.number="mainBreakerSize"
                  persistent-placeholder
                  density="compact"
                  :min="minMainBreakerSize"
                  :rules="mainBreakerRules"
                ></v-text-field>
              </p>
            </v-col>
            <v-divider vertical></v-divider>

            <v-col class="py-0">
              <p>Wire Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'COPPER').wire }} CU</p>
              <p>Conduit Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'COPPER').conduit }}</p>
              <p>GEC Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'COPPER').gec }}</p>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col class="py-0">
              <p>Wire Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'ALUMINUM').wire }} AL</p>
              <p>Conduit Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'ALUMINUM').conduit }}</p>
              <p>GEC Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'ALUMINUM').gec }}</p>
            </v-col>

            <v-col cols="2">
              <v-btn prepend-icon="mdi-download" small color="primary" variant="flat" @click="generatePDF">Download PDF</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
import * as pdfMake from 'pdfmake/build/pdfmake';

// PDF Fonts
const pdfFonts = {
  // download default Roboto font from cdnjs.com
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};
import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();

export default {
  data() {
    return {
      valid: true,
      mainBreakerSize: 0,
      minMainBreakerSize: 0,
      mainBreakerRules: [(v) => v >= this.minMainBreakerSize || 'Minimum is ' + this.minMainBreakerSize],
      address: '',
      propertyData: {
        yearBuilt: '',
        squareFootage: '', // Initialize as empty
        propertyType: 'Single Dwelling Unit',
        voltage: '240V' // Assuming 240V service
      },
      propertyTypes: ['Single Dwelling Unit', 'Multi-Family', 'Commercial'],
      voltageOptions: ['120V', '208V', '240V'],
      generalLoadItems: [],
      fixedAppliances: [],
      dryerItems: [],
      cookingEquipmentItems: [],
      hvacLoadOptions: [],
      largestMotor: {
        va: 0
      },
      otherLoads: [],
      // Predefined appliances
      predefinedAppliances: [
        // Fixed Appliances
        {
          title: 'Electric Water Heater',
          va: 4500,
          isMotor: false,
          category: 'Fixed Appliance',
          type: 'Water Heater',
          size: ['small', 'medium', 'large']
        },
        { title: 'Tankless Water Heater', va: 12000, isMotor: false, category: 'Fixed Appliance', type: 'Water Heater', size: ['large'] },
        {
          title: 'Dishwasher',
          va: 950,
          isMotor: false,
          category: 'Fixed Appliance',
          type: 'Dishwasher',
          size: ['small', 'medium', 'large']
        },
        {
          title: 'Garbage Disposal',
          va: 1125,
          isMotor: true,
          category: 'Fixed Appliance',
          type: 'Garbage Disposal',
          size: ['medium', 'large']
        },
        {
          title: 'Standard Refrigerator',
          va: 600,
          isMotor: true,
          category: 'Fixed Appliance',
          type: 'Refrigerator',
          size: ['small', 'medium']
        },
        { title: 'Large Refrigerator', va: 1200, isMotor: true, category: 'Fixed Appliance', type: 'Refrigerator', size: ['large'] },
        { title: 'Freezer', va: 500, isMotor: true, category: 'Fixed Appliance', type: 'Freezer', size: ['medium', 'large'] },
        {
          title: 'Microwave Oven',
          va: 1500,
          isMotor: false,
          category: 'Fixed Appliance',
          type: 'Microwave Oven',
          size: ['small', 'medium', 'large']
        },
        {
          title: 'Washing Machine',
          va: 500,
          isMotor: true,
          category: 'Fixed Appliance',
          type: 'Washing Machine',
          size: ['small', 'medium', 'large']
        },

        // Dryer
        { title: 'Electric Dryer', va: 5000, isMotor: false, category: 'Dryer', type: 'Dryer', size: ['medium', 'large'] },
        { title: 'Gas Dryer', va: 1500, isMotor: false, category: 'Dryer', type: 'Dryer', size: [] },

        // Cooking Equipment
        {
          title: 'Electric Range',
          va: 8000,
          isMotor: false,
          category: 'Cooking Equipment',
          type: 'Range',
          size: ['small', 'medium', 'large']
        },
        { title: 'Gas Range', va: 1200, isMotor: false, category: 'Cooking Equipment', type: 'Range', size: [] },
        { title: 'Wall Oven', va: 6000, isMotor: false, category: 'Cooking Equipment', type: 'Wall Oven', size: [] },
        { title: 'Cooktop', va: 7000, isMotor: false, category: 'Cooking Equipment', type: 'Cooktop', size: [] },

        // HVAC
        { title: 'Small Heat Pump', va: 6000, isMotor: false, category: 'HVAC', type: 'Heat Pump', heating: true, size: ['small'] },
        { title: 'Medium Heat Pump', va: 10000, isMotor: false, category: 'HVAC', type: 'Heat Pump', heating: true, size: ['medium'] },
        { title: 'Large Heat Pump', va: 14000, isMotor: false, category: 'HVAC', type: 'Heat Pump', heating: true, size: ['large'] },

        // Other Loads
        { title: 'EV Charger Level 1', va: 1440, isMotor: false, category: 'Other', type: 'EV Charger', size: ['medium'] },
        { title: 'EV Charger Level 2', va: 9600, isMotor: false, category: 'Other', type: 'EV Charger', size: ['large'] },
        { title: 'Well Pump', va: 1000, isMotor: true, category: 'Other', type: 'Well Pump', size: [] }
      ],
      // Modal control
      showApplianceModal: false,
      selectedAppliance: null,
      newAppliance: {
        option: 'predefined',
        name: '',
        va: 0,
        isMotor: false
      }
    };
  },
  watch: {
    'propertyData.squareFootage': function (newVal) {
      if (newVal && newVal > 0) {
        this.loadDefaultsBasedOnSquareFootage();
      }
    },
    fixedAppliances: {
      handler() {
        this.updateLargestMotor();
      },
      deep: true
    },
    otherLoads: {
      handler() {
        this.updateLargestMotor();
      },
      deep: true
    }
  },
  methods: {
    // Open the appliance modal
    openApplianceModal(section) {
      this.selectedAppliance = null;
      this.currentSection = section;
      this.resetNewAppliance();
      // Filter appliances based on the current section
      this.filteredAppliances = this.predefinedAppliances.filter((appliance) => appliance.category === this.currentSection);
      this.showApplianceModal = true;
    },
    // Close the appliance modal
    closeApplianceModal() {
      this.showApplianceModal = false;
    },
    // Reset new appliance data
    resetNewAppliance() {
      this.newAppliance = {
        option: 'predefined',
        selectedAppliance: null,
        name: '',
        va: 0,
        isMotor: false
      };
    },
    // Handle appliance option change
    onApplianceOptionChange() {
      // Reset fields when option changes
      this.selectedAppliance = null;
      this.newAppliance.name = '';
      this.newAppliance.va = 0;
      this.newAppliance.isMotor = false;
    },
    // Handle predefined appliance selection
    onPredefinedApplianceSelected() {
      if (this.selectedAppliance) {
        this.newAppliance.name = this.selectedAppliance.title;
        this.newAppliance.va = this.selectedAppliance.va;
        this.newAppliance.isMotor = this.selectedAppliance.isMotor;
        console.log(this.fixedAppliances, this.newAppliance);
      }
    },
    onPredefinedApplianceSelected() {
      if (this.selectedAppliance) {
        this.newAppliance.name = this.selectedAppliance.title;
        this.newAppliance.isMotor = this.selectedAppliance.isMotor;

        this.newAppliance.va = this.selectedAppliance.va;
      }
    },
    // Add appliance to the list
    addAppliance() {
      let newItem = {
        name: this.newAppliance.name,
        quantity: 1,
        isMotor: this.newAppliance.isMotor
      };

      newItem.va = this.newAppliance.va;
      if (!newItem.va) {
        snackbarStore.showSnackbar('Please enter the VA per unit.', 'error');
        return;
      }
      if (!newItem.name) {
        snackbarStore.showSnackbar('Please enter the name.', 'error');
        return;
      }
      if (this.currentSection === 'Fixed Appliance') {
        this.fixedAppliances.push(newItem);
      } else if (this.currentSection === 'Dryer') {
        newItem.vaRules = [(v) => v >= 5000 || 'Minimum VA is 5000 or nameplate rating, whichever is larger'];
        this.dryerItems.push(newItem);
      } else if (this.currentSection === 'HVAC') {
        this.hvacLoadOptions.push(newItem);
      } else if (this.currentSection === 'Cooking Equipment') {
        this.cookingEquipmentItems.push(newItem);
      } else {
        // Handle other sections if needed
        this.otherLoads.push(newItem);
      }

      this.closeApplianceModal();
      this.updateLargestMotor();
    },
    // Update largest motor load
    updateLargestMotor() {
      const motorLoads = [
        ...this.fixedAppliances.filter((appliance) => appliance.isMotor),
        ...this.otherLoads.filter((load) => load.isMotor),
        ...this.hvacLoadOptions.filter((load) => load.isMotor)
        // Include other sections if needed
      ];
      if (motorLoads.length > 0) {
        const largestMotorLoad = Math.max(...motorLoads.map((item) => this.calculateItemTotalVA(item) / item.quantity));
        this.largestMotor.va = largestMotorLoad;
      } else {
        this.largestMotor.va = 0;
      }
    },
    loadDefaultsBasedOnSquareFootage() {
      const sqft = this.propertyData.squareFootage;
      let houseSize = 'small'; // Default to small

      // Determine house size based on square footage
      if (sqft > 1500 && sqft <= 2500) {
        houseSize = 'medium';
      } else if (sqft > 2500) {
        houseSize = 'large';
      }

      // Reset largest motor
      this.largestMotor.va = 0;

      // Clear existing items
      this.generalLoadItems = [];
      this.fixedAppliances = [];
      this.dryerItems = [];
      this.cookingEquipmentItems = [];
      this.hvacLoadOptions = [];
      this.otherLoads = [];

      // General Load
      this.generalLoadItems.push({
        name: 'Lighting & Receptacles',
        quantity: sqft, // Square footage
        va: 3,
        units: 'sqft',
        quantityRules: [],
        vaRules: [(v) => v >= 3 || 'Minimum VA per unit is 3'],
        readonly: true
      });

      // Small Appliance Circuits based on square footage
      let smallApplianceCircuits = 2;
      if (sqft > 1500 && sqft <= 2500) {
        smallApplianceCircuits = 3;
      } else if (sqft > 2500 && sqft <= 4000) {
        smallApplianceCircuits = 4;
      } else if (sqft > 4000) {
        smallApplianceCircuits = 5;
      }
      this.generalLoadItems.push({
        name: 'Small Appliance Circuits',
        quantity: smallApplianceCircuits,
        va: 1500,
        units: '',
        quantityRules: [(v) => v >= 2 || 'Minimum quantity is 2'],
        vaRules: [],
        readonly: true
      });

      // Laundry Circuits
      this.generalLoadItems.push({
        name: 'Laundry Circuits',
        quantity: 1,
        va: 1500,
        units: '',
        quantityRules: [(v) => v >= 1 || 'Minimum quantity is 1'],
        vaRules: [],
        readonly: true
      });

      // Load predefined appliances based on house size
      this.predefinedAppliances.forEach((appliance) => {
        if (appliance.size.includes(houseSize)) {
          switch (appliance.category) {
            case 'Fixed Appliance':
              this.fixedAppliances.push({
                name: appliance.title,
                quantity: 1,
                va: appliance.va,
                isMotor: appliance.isMotor || false
              });
              break;
            case 'Dryer':
              this.dryerItems.push({
                name: appliance.title,
                quantity: 1,
                va: appliance.va,
                vaRules: appliance.vaRules || []
              });
              break;
            case 'Cooking Equipment':
              this.cookingEquipmentItems.push({
                name: appliance.title,
                quantity: 1,
                va: appliance.va
              });
              break;
            case 'HVAC':
              this.hvacLoadOptions.push({
                name: appliance.title,
                quantity: 1,
                va: appliance.va,
                heating: appliance?.heating,
                cooling: appliance?.cooling
              });
              break;
            case 'Other':
              this.otherLoads.push({
                name: appliance.title,
                quantity: 1,
                va: appliance.va,
                isMotor: appliance.isMotor || false
              });
              break;
          }
        }
      });

      this.updateLargestMotor();
    },

    // Existing methods remain the same
    addGeneralLoadItem() {
      this.generalLoadItems.push({
        name: '',
        quantity: 0,
        va: 0,
        units: '',
        quantityRules: [],
        vaRules: [],
        readonly: false
      });
    },
    removeGeneralLoadItem(item) {
      const index = this.generalLoadItems.indexOf(item);
      if (index > -1 && !item.readonly) {
        this.generalLoadItems.splice(index, 1);
      }
    },
    calculateItemTotalVA(item) {
      return item.quantity * item.va || 0;
    },
    getQuantityRules(item) {
      return item.quantityRules || [];
    },
    getVARules(item) {
      return item.vaRules || [];
    },
    calculateGeneralLoad() {
      const totalVA = this.generalLoadItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
      const first3000VA = Math.min(3000, totalVA);
      const remainingVA = Math.max(0, totalVA - 3000);
      const demandVA = first3000VA + remainingVA * 0.35;
      return Math.round(demandVA);
    },
    addFixedAppliance() {
      this.fixedAppliances.push({ name: '', quantity: 1, va: 0 });
    },
    removeFixedAppliance(item) {
      const index = this.fixedAppliances.indexOf(item);
      if (index > -1) {
        this.fixedAppliances.splice(index, 1);
        this.updateLargestMotor();
      }
    },
    calculateFixedAppliancesLoad() {
      const totalVA = this.fixedAppliances.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
      if (this.fixedAppliances.length >= 4) {
        return Math.round(totalVA * 0.75);
      }
      return totalVA;
    },
    addDryerItem() {
      this.dryerItems.push({
        name: 'Dryer',
        quantity: 1,
        va: 5000,
        vaRules: [(v) => v >= 5000 || 'Minimum VA is 5000 or nameplate rating, whichever is larger']
      });
    },
    removeDryerItem(item) {
      const index = this.dryerItems.indexOf(item);
      if (index > -1) {
        this.dryerItems.splice(index, 1);
        this.updateLargestMotor();
      }
    },
    calculateDryerItemTotalVA(item) {
      const unitVA = Math.max(item.va, 5000);
      return item.quantity * unitVA;
    },
    calculateDryerLoad() {
      return this.dryerItems.reduce((total, item) => total + this.calculateDryerItemTotalVA(item), 0);
    },
    addCookingEquipmentItem() {
      this.cookingEquipmentItems.push({ name: '', quantity: 1, va: 0 });
    },
    removeCookingEquipmentItem(item) {
      const index = this.cookingEquipmentItems.indexOf(item);
      if (index > -1) {
        this.cookingEquipmentItems.splice(index, 1);
        this.updateLargestMotor();
      }
    },
    calculateLargestMotorLoad() {
      return Math.round(this.largestMotor.va * 0.25);
    },
    calculateItemTotalVA(item) {
      return item.quantity * item.va || 0;
    },
    calculateCookingEquipmentLoad() {
      let totalConnectedVA = this.cookingEquipmentItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
      let totalAppliances = this.cookingEquipmentItems.reduce((total, item) => total + item.quantity, 0);

      if (totalAppliances === 0) {
        return 0;
      }

      let averageVA = totalConnectedVA / totalAppliances;
      let demandVA = this.applyNEC22055(totalAppliances, averageVA);
      return Math.round(demandVA);
    },
    applyNEC22055(totalAppliances, averageVA) {
      let demandVA = 0;

      if (totalAppliances === 1) {
        demandVA = averageVA * 0.8;
      } else if (totalAppliances === 2) {
        demandVA = averageVA * 2 * 0.65;
      } else if (totalAppliances === 3) {
        demandVA = averageVA * 3 * 0.55;
      } else if (totalAppliances === 4) {
        demandVA = averageVA * 4 * 0.5;
      } else {
        demandVA = averageVA * totalAppliances * 0.45;
      }

      if (averageVA > 12000) {
        let extraVA = averageVA - 12000;
        let demandFactorIncrease = Math.ceil(extraVA) * 0.05;
        demandVA *= 1 + demandFactorIncrease;
      }

      return demandVA;
    },
    addHVACLoadItem() {
      this.hvacLoadOptions.push({ label: '', quantity: 1, va: 0 });
    },
    removeHVACLoadItem(item) {
      const index = this.hvacLoadOptions.indexOf(item);
      if (index > -1) {
        this.hvacLoadOptions.splice(index, 1);
        this.updateLargestMotor();
      }
    },
    calculateHVACLoad() {
      const heatingItems = this.hvacLoadOptions.filter((item) => item?.heating);
      console.log(this.hvacLoadOptions);
      const coolingItems = this.hvacLoadOptions.filter((item) => item?.cooling);

      const heatingLoad = heatingItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
      const coolingLoad = coolingItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);

      return Math.max(heatingLoad, coolingLoad);
    },
    removeLargestMotor() {
      this.largestMotor.va = 0;
      this.updateLargestMotor();
    },
    calculateLargestMotorLoad() {
      return Math.round(this.largestMotor.va * 0.25);
    },
    addOtherLoad() {
      this.otherLoads.push({ name: '', quantity: 1, va: 0 });
    },
    removeOtherLoad(item) {
      const index = this.otherLoads.indexOf(item);
      if (index > -1) {
        this.otherLoads.splice(index, 1);
        this.updateLargestMotor();
      }
    },
    calculateOtherLoads() {
      return this.otherLoads.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
    },
    calculateTotalLoad() {
      const generalLoad = this.calculateGeneralLoad();
      const fixedAppliancesLoad = this.calculateFixedAppliancesLoad();
      const dryerLoad = this.calculateDryerLoad();
      const cookingEquipmentLoad = this.calculateCookingEquipmentLoad();
      const hvacLoad = this.calculateHVACLoad();
      const largestMotorLoad = this.calculateLargestMotorLoad();
      const otherLoads = this.calculateOtherLoads();

      let subtotal = generalLoad + fixedAppliancesLoad + dryerLoad + cookingEquipmentLoad + otherLoads;

      let demandLoad = subtotal + hvacLoad + largestMotorLoad;

      return Math.round(demandLoad);
    },
    calculateAmperage() {
      const totalLoad = this.calculateTotalLoad();
      const voltage = parseInt(this.propertyData.voltage);
      return Math.round(totalLoad / voltage);
    },
    getServiceSizing(rating, wireType) {
      let wireSize = '';
      let conduitSize = '';
      let gecSize = '';

      if (wireType.toUpperCase() === 'COPPER') {
        switch (rating) {
          case 100:
            wireSize = '#4';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 125:
            wireSize = '#2';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 150:
            wireSize = '#1';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 175:
            wireSize = '#1/0';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 200:
            wireSize = '#2/0';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 225:
            wireSize = '#3/0';
            conduitSize = '2" PVC/EMT';
            break;
          case 300:
            wireSize = '250 kcmil';
            conduitSize = '2" PVC/EMT';
            break;
          case 400:
            wireSize = '400 kcmil';
            conduitSize = '2-1/2" PVC/EMT';
            break;
          default:
            wireSize = '-- CU';
            conduitSize = '-- PVC/EMT';
            break;
        }

        gecSize = this.getGECSize(wireSize, 'COPPER');
      } else if (wireType.toUpperCase() === 'ALUMINUM') {
        switch (rating) {
          case 100:
            wireSize = '#2';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 125:
            wireSize = '#1/0';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 150:
            wireSize = '#2/0';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 175:
            wireSize = '#3/0';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 200:
            wireSize = '#4/0';
            conduitSize = '1-1/2" PVC/EMT';
            break;
          case 225:
            wireSize = '250 kcmil';
            conduitSize = '2" PVC/EMT';
            break;
          case 300:
            wireSize = '350 kcmil';
            conduitSize = '2-1/2" PVC/EMT';
            break;
          case 400:
            wireSize = '600 kcmil';
            conduitSize = '3" PVC/EMT';
            break;
          default:
            wireSize = '-- AL';
            conduitSize = '-- PVC/EMT';
            break;
        }

        gecSize = this.getGECSize(wireSize, 'ALUMINUM');
      }

      return {
        wire: wireSize,
        conduit: conduitSize,
        gec: gecSize
      };
    },
    getGECSize(conductorSize, wireType) {
      const wireSizeOrder = {
        '#14': 1,
        '#12': 2,
        '#10': 3,
        '#8': 4,
        '#6': 5,
        '#4': 6,
        '#3': 7,
        '#2': 8,
        '#1': 9,
        '#1/0': 10,
        '#2/0': 11,
        '#3/0': 12,
        '#4/0': 13,
        '250 kcmil': 14,
        '300 kcmil': 15,
        '350 kcmil': 16,
        '400 kcmil': 17,
        '500 kcmil': 18,
        '600 kcmil': 19,
        '700 kcmil': 20,
        '750 kcmil': 21,
        '900 kcmil': 22,
        '1000 kcmil': 23,
        '1250 kcmil': 24,
        '1500 kcmil': 25,
        '1750 kcmil': 26,
        '2000 kcmil': 27
      };

      const sizeIndex = wireSizeOrder[conductorSize];

      let gecSize = '';

      if (!sizeIndex) {
        gecSize = '-- ' + wireType.toUpperCase();
        return gecSize;
      }

      if (wireType.toUpperCase() === 'COPPER') {
        if (sizeIndex <= wireSizeOrder['#2']) {
          gecSize = '#8 CU';
        } else if (sizeIndex <= wireSizeOrder['#1/0']) {
          gecSize = '#6 CU';
        } else if (sizeIndex <= wireSizeOrder['#3/0']) {
          gecSize = '#4 CU';
        } else if (sizeIndex <= wireSizeOrder['350 kcmil']) {
          gecSize = '#2 CU';
        } else if (sizeIndex <= wireSizeOrder['600 kcmil']) {
          gecSize = '#1/0 CU';
        } else if (sizeIndex <= wireSizeOrder['1100 kcmil']) {
          gecSize = '#2/0 CU';
        } else {
          gecSize = '#3/0 CU';
        }
      } else if (wireType.toUpperCase() === 'ALUMINUM') {
        if (sizeIndex <= wireSizeOrder['#1/0']) {
          gecSize = '#6 AL';
        } else if (sizeIndex <= wireSizeOrder['#3/0']) {
          gecSize = '#4 AL';
        } else if (sizeIndex <= wireSizeOrder['250 kcmil']) {
          gecSize = '#2 AL';
        } else if (sizeIndex <= wireSizeOrder['500 kcmil']) {
          gecSize = '#1/0 AL';
        } else if (sizeIndex <= wireSizeOrder['900 kcmil']) {
          gecSize = '#3/0 AL';
        } else if (sizeIndex <= wireSizeOrder['1750 kcmil']) {
          gecSize = '#4/0 AL';
        } else {
          gecSize = '250 kcmil AL';
        }
      } else {
        gecSize = '-- ' + wireType.toUpperCase();
      }

      return gecSize;
    },
    getStandardBreakerSize(calculatedAmperage) {
      const standardSizes = [100, 125, 150, 175, 200, 225, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000];

      for (let i = 0; i < standardSizes.length; i++) {
        if (standardSizes[i] >= calculatedAmperage) {
          this.mainBreakerSize = standardSizes[i];
          this.minMainBreakerSize = standardSizes[i];
          return standardSizes[i];
        }
      }

      return 0;
    },
    generatePDF() {
      // Prepare data for the PDF
      const docDefinition = {
        content: [
          { text: 'Dwelling Unit Standard Service Load Calculation', style: 'header' },
          {
            columns: [
              { text: `Property Address: ${this.address || 'N/A'}`, style: 'subheader' },
              {
                text: [
                  { text: `Voltage: ${this.propertyData.voltage || 'N/A'}`, style: 'propertyDetails' },
                  '\n',
                  { text: `Living Floor Area: ${this.propertyData.squareFootage || 'N/A'} sqft`, style: 'propertyDetails' }
                ]
              }
            ],
            columnGap: 20
          },
          { text: ' ' }, // Add space

          // General Load Section
          this.createTable(this.generalLoadItems, ['General Load', 'Quantity', 'VA per Unit', 'Total VA'], ['*', 'auto', 'auto', 'auto']),

          // Fixed Appliances Section
          this.createTable(this.fixedAppliances, ['Fixed Appliance', 'Quantity', 'VA per Unit', 'Total VA'], ['*', 'auto', 'auto', 'auto']),

          // Dryer Section
          this.createTable(this.dryerItems, ['Dryer', 'Quantity', 'VA per Unit', 'Total VA'], ['*', 'auto', 'auto', 'auto']),

          // Cooking Equipment Section
          this.createTable(
            this.cookingEquipmentItems,
            ['Cooking Equipment', 'Quantity', 'VA per Unit', 'Total VA'],
            ['*', 'auto', 'auto', 'auto']
          ),

          // HVAC Load Section
          this.createTable(
            this.hvacLoadOptions,
            ['HVAC (Heating or A/C)', 'Quantity', 'VA per Unit', 'Total VA'],
            ['*', 'auto', 'auto', 'auto']
          ),

          // Largest Motor Section
          this.createLargestMotorTable(),

          // Other Loads Section
          this.createTable(this.otherLoads, ['Other Loads', 'Quantity', 'VA per Unit', 'Total VA'], ['*', 'auto', 'auto', 'auto']),

          // Final Calculations Section
          { text: 'Final Calculations', style: 'sectionHeader', margin: [0, 10, 0, 5] },
          this.createFinalCalculationsTable(),

          // Service Sizing
          { text: 'Typical Service Sizing', style: 'sectionHeader' },
          this.createServiceSizingTable()
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          subheader: {
            fontSize: 11,
            bold: true,
            margin: [0, 5, 0, 2]
          },
          propertyDetails: {
            fontSize: 11
          },
          sectionHeader: {
            fontSize: 12,
            bold: true,
            color: '#2a8899',
            margin: [0, 8, 0, 5]
          },
          tableHeader: {
            bold: true,
            fillColor: '#eefaff',
            alignment: 'left'
          },
          tableExample: {
            margin: [0, 3, 0, 5]
          },
          finalCalculations: {
            margin: [0, 3, 0, 5],
            fontSize: 11
          }
        },
        defaultStyle: {
          fontSize: 10
        },
        pageMargins: [20, 20, 20, 20] // Reduce margins to save space
      };

      // Generate and download the PDF
      pdfMake.createPdf(docDefinition, null, pdfFonts).download('Load_Calculation.pdf');
    },

    // Helper method to create a table
    createTable(items, headers, widths) {
      // Build table body
      const body = [];

      // Add header row
      body.push(headers.map((header) => ({ text: header, style: 'tableHeader' })));

      if (items.length > 0) {
        // Add data rows
        items.forEach((item) => {
          let row;
          if (headers.includes('Total VA')) {
            row = [item.name || item.label || '', item.quantity || '', item.va || '', this.calculateItemTotalVA(item)];
          } else if (headers.includes('Total VA')) {
            row = [item.name || '', item.quantity || '', item.va || '', this.calculateItemTotalVA(item)];
          } else {
            row = [];
          }
          body.push(row);
        });
      } else {
        // No items, add a row with N/A
        const naRow = headers.map(() => 'N/A');
        body.push(naRow);
      }

      return {
        style: 'tableExample',
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          widths: widths,
          body: body
        }
      };
    },

    // Helper method to create Largest Motor table
    createLargestMotorTable() {
      return {
        style: 'tableExample',
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            [
              { text: 'Largest Motor VA', style: 'tableHeader' },
              { text: '25% of Largest Motor VA', style: 'tableHeader' }
            ],
            [this.largestMotor.va || 'N/A', this.largestMotor.va ? this.calculateLargestMotorLoad() : 'N/A']
          ]
        }
      };
    },

    // Helper method to create Final Calculations table
    createFinalCalculationsTable() {
      return {
        style: 'tableExample',
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Total Calculated Load:', style: 'tableHeader' },
              { text: this.calculateTotalLoad() + ' VA', style: 'tableHeader' }
            ],
            [
              { text: 'Calculated Amperage:', style: 'tableHeader' },
              { text: this.calculateAmperage() + ' A', style: 'tableHeader' }
            ],
            [
              { text: 'Main Breaker Size:', style: 'tableHeader' },
              { text: this.mainBreakerSize + ' A', style: 'tableHeader' }
            ]
          ]
        }
      };
    },

    // Helper method to create service sizing table
    createServiceSizingTable() {
      const calculatedAmperage = this.calculateAmperage();
      const breakerSize = this.getStandardBreakerSize(calculatedAmperage);
      const copperSizing = this.getServiceSizing(breakerSize, 'COPPER');
      const aluminumSizing = this.getServiceSizing(breakerSize, 'ALUMINUM');

      return {
        style: 'tableExample',
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Material', style: 'tableHeader' },
              { text: 'GEC Size', style: 'tableHeader' },
              { text: 'Conduit Size', style: 'tableHeader' }
            ],
            ['Copper', copperSizing.wire || 'N/A', copperSizing.conduit || 'N/A'],
            ['Aluminum', aluminumSizing.wire || 'N/A', aluminumSizing.conduit || 'N/A']
          ]
        }
      };
    }
  }
};
</script>

<style scoped>
.perfectScroll {
  width: 100%;
  height: calc(100vh - 338px);
}
</style>
