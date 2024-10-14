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
                  <v-col cols="12" class="pa-0">
                    <v-text-field class="mr-3" label="Property Address" v-model="address" variant="outlined"></v-text-field>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6" class="pa-0">
                    <v-select
                      class="mr-3"
                      :items="voltageOptions"
                      label="Voltage"
                      v-model="propertyData.voltage"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6" class="pa-0">
                    <v-text-field
                      class="mr-3"
                      label="Living Floor Area"
                      v-model.number="propertyData.squareFootage"
                      variant="outlined"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>

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
                  <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                    <v-btn small color="primary" variant="tonal" @click="addGeneralLoadItem">Add Item</v-btn>
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
                    <v-text-field label="Appliance" v-model="item.name" variant="outlined"></v-text-field>
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
                  <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                    <v-btn small color="primary" variant="tonal" @click="addFixedAppliance">Add Appliance</v-btn>
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
                  <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                    <v-btn small color="primary" variant="tonal" @click="addDryerItem">Add Dryer</v-btn>
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
                  <!-- kW Rating -->
                  <v-col class="py-0" cols="2">
                    <v-text-field
                      label="kW Rating per Unit"
                      v-model.number="item.kw"
                      type="number"
                      variant="outlined"
                      min="0"
                    ></v-text-field>
                  </v-col>
                  <!-- Total kW -->
                  <v-col class="py-0" cols="2">
                    <v-text-field
                      label="Total kW"
                      :value="calculateItemTotalKW(item)"
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
                  <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                    <v-btn small color="primary" variant="tonal" @click="addCookingEquipmentItem">Add Equipment</v-btn>
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
                    <v-text-field label="Label" v-model="item.label" variant="outlined"></v-text-field>
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
                  <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                    <v-btn small color="primary" variant="tonal" @click="addHVACLoadItem">Add Item</v-btn>
                    <p class="font-weight-bold">Total HVAC Load: {{ calculateHVACLoad() }} VA</p>
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
                  <v-col cols="12" class="d-flex justify-end align-center px-0">
                    <p class="font-weight-bold">Largest Motor Load (25%): {{ calculateLargestMotorLoad() }} VA</p>
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
                  <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                    <v-btn small color="primary" variant="tonal" @click="addOtherLoad">Add Load</v-btn>
                    <p class="font-weight-bold">Total Other Loads: {{ calculateOtherLoads() }} VA</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-col>
          </v-row>
        </perfect-scrollbar>
      </v-form>
    </v-card-text>
  </v-card>
  <!-- Final Calculation -->
  <v-card elevation="0" class="innerCard maxWidth">
    <div class="mt-2">
      <!-- Final Load Calculation -->
      <v-card-title>Final Calculation</v-card-title>
      <v-card-text>
        <v-row class="d-flex justify-space-between align-center">
          <v-col>
            <p>Total Calculated Load: {{ calculateTotalLoad() }} VA</p>
            <p>Calculated Amperage: {{ calculateAmperage() }} A</p>
            <p>
              <b>Main Breaker Size: {{ getStandardBreakerSize(calculateAmperage()) }} A</b>
            </p>
          </v-col>
          <v-divider vertical></v-divider>

          <v-col>
            <p>Wire Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'COPPER').wire }} CU</p>
            <p>Conduit Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'COPPER').conduit }}</p>
            <p>GEC Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'COPPER').gec }}</p>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col>
            <p>Wire Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'ALUMINUM').wire }} AL</p>
            <p>Conduit Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'ALUMINUM').conduit }}</p>
            <p>GEC Size: {{ getServiceSizing(getStandardBreakerSize(calculateAmperage()), 'ALUMINUM').gec }}</p>
          </v-col>

          <v-col cols="2">
            <v-btn prepend-icon="mdi-download" small color="primary" variant="flat" @click="">Download PDF</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      valid: true,
      address: '',
      propertyData: {
        yearBuilt: '',
        squareFootage: 3700, // From the example
        propertyType: 'Single Dwelling Unit',
        voltage: '240V' // Assuming 240V service
      },
      propertyTypes: ['Single Dwelling Unit', 'Multi-Family', 'Commercial'],
      voltageOptions: ['120V', '208V', '240V'],
      generalLoadItems: [
        {
          name: 'Lighting & Receptacles',
          quantity: 3700, // Square footage
          va: 3,
          units: 'sqft',
          quantityRules: [],
          vaRules: [(v) => v >= 3 || 'Minimum VA per unit is 3'],
          readonly: true
        },
        {
          name: 'Small Appliance Circuits',
          quantity: 5,
          va: 1500,
          units: '',
          quantityRules: [(v) => v >= 2 || 'Minimum quantity is 2'],
          vaRules: [],
          readonly: true
        },
        {
          name: 'Laundry Circuits',
          quantity: 2,
          va: 1500,
          units: '',
          quantityRules: [(v) => v >= 1 || 'Minimum quantity is 1'],
          vaRules: [],
          readonly: true
        }
      ],
      fixedAppliances: [
        {
          name: 'Water Heater',
          quantity: 1,
          va: 5000
        },
        {
          name: 'Trash Compactor',
          quantity: 1,
          va: 1200
        },
        {
          name: 'Dishwasher',
          quantity: 1,
          va: 1440
        },
        {
          name: 'Garbage Disposal',
          quantity: 1,
          va: 1127
        },
        {
          name: 'Attic Fans',
          quantity: 3,
          va: 600 // 5A x 120V per fan = 600 VA
        }
      ],
      // Dryer Items (Modified)
      dryerItems: [
        {
          name: 'Dryer',
          quantity: 1,
          va: 6000, // 6 kW = 6000 VA
          vaRules: [(v) => v >= 5000 || 'Minimum VA is 5000 or nameplate rating, whichever is larger']
        }
      ],
      cookingEquipmentItems: [
        {
          name: 'Cooktop',
          quantity: 1,
          kw: 7
        },
        {
          name: 'Wall Oven',
          quantity: 1,
          kw: 6
        }
      ],
      hvacLoadOptions: [
        {
          label: 'Space Electric Heat',
          quantity: 1,
          va: 16000 // 16 kW = 16,000 VA
        },
        {
          label: 'Air Handler (Blower Motor)',
          quantity: 1,
          va: 460 // 4A x 115V = 460 VA
        }
      ],
      largestMotor: {
        va: 1127 // Garbage Disposal as the largest motor
      },
      otherLoads: []
    };
  },
  methods: {
    // General Load Methods
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
      // Sum up the total VA without demand factors
      const totalVA = this.generalLoadItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);

      // Apply demand factors as per NEC
      const first3000VA = Math.min(3000, totalVA);
      const remainingVA = Math.max(0, totalVA - 3000);
      const demandVA = first3000VA + remainingVA * 0.35;

      return Math.round(demandVA);
    },

    // Fixed Appliances Methods
    addFixedAppliance() {
      this.fixedAppliances.push({ name: '', quantity: 1, va: 0 });
    },
    removeFixedAppliance(item) {
      const index = this.fixedAppliances.indexOf(item);
      if (index > -1) {
        this.fixedAppliances.splice(index, 1);
      }
    },
    calculateFixedAppliancesLoad() {
      const totalVA = this.fixedAppliances.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);

      // Apply 75% demand factor if there are four or more appliances (NEC 220.53)
      if (this.fixedAppliances.length >= 4) {
        return Math.round(totalVA * 0.75);
      }
      return totalVA;
    },

    // Dryer Methods (Modified)
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
      }
    },
    calculateDryerItemTotalVA(item) {
      const unitVA = Math.max(item.va, 5000); // Minimum VA is 5000
      return item.quantity * unitVA;
    },
    calculateDryerLoad() {
      return this.dryerItems.reduce((total, item) => total + this.calculateDryerItemTotalVA(item), 0);
    },

    // Cooking Equipment Methods
    addCookingEquipmentItem() {
      this.cookingEquipmentItems.push({ name: '', quantity: 1, kw: 0 });
    },
    removeCookingEquipmentItem(item) {
      const index = this.cookingEquipmentItems.indexOf(item);
      if (index > -1) {
        this.cookingEquipmentItems.splice(index, 1);
      }
    },
    calculateItemTotalKW(item) {
      return item.quantity * item.kw || 0;
    },
    calculateCookingEquipmentLoad() {
      // Total connected load in kW
      let totalConnectedKW = this.cookingEquipmentItems.reduce((total, item) => total + this.calculateItemTotalKW(item), 0);

      // Total number of appliances
      let totalAppliances = this.cookingEquipmentItems.reduce((total, item) => total + item.quantity, 0);

      if (totalAppliances === 0) {
        return 0;
      }

      // Average kW rating
      let averageKW = totalConnectedKW / totalAppliances;

      // Apply NEC Table 220.55
      let demandKW = this.applyNEC22055(totalAppliances, averageKW);

      // Convert kW to VA
      return Math.round(demandKW * 1000);
    },
    applyNEC22055(totalAppliances, averageKW) {
      // Simplified implementation for the example
      // Using Column C and applying demand factors

      let demandKW = 0;

      if (totalAppliances === 1) {
        demandKW = averageKW * 0.8;
      } else if (totalAppliances === 2) {
        demandKW = averageKW * 2 * 0.65;
      } else if (totalAppliances === 3) {
        demandKW = averageKW * 3 * 0.55;
      } else if (totalAppliances === 4) {
        demandKW = averageKW * 4 * 0.5;
      } else {
        // For 5 or more appliances, use 45% demand factor
        demandKW = averageKW * totalAppliances * 0.45;
      }

      // Adjust for appliances over 12 kW
      if (averageKW > 12) {
        let extraKW = averageKW - 12;
        let demandFactorIncrease = Math.ceil(extraKW) * 0.05;
        demandKW *= 1 + demandFactorIncrease;
      }

      return demandKW;
    },

    // HVAC Load Methods
    addHVACLoadItem() {
      this.hvacLoadOptions.push({ label: '', quantity: 1, va: 0 });
    },
    removeHVACLoadItem(item) {
      const index = this.hvacLoadOptions.indexOf(item);
      if (index > -1) {
        this.hvacLoadOptions.splice(index, 1);
      }
    },
    calculateHVACLoad() {
      const heatingItems = this.hvacLoadOptions.filter((item) => item.label.toLowerCase().includes('heat'));
      const coolingItems = this.hvacLoadOptions.filter((item) => item.label.toLowerCase().includes('air conditioner'));

      const heatingLoad = heatingItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
      const coolingLoad = coolingItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);

      return Math.max(heatingLoad, coolingLoad);
    },

    // Largest Motor Methods
    removeLargestMotor() {
      this.largestMotor.va = 0;
    },
    calculateLargestMotorLoad() {
      return Math.round(this.largestMotor.va * 0.25);
    },

    // Other Loads Methods
    addOtherLoad() {
      this.otherLoads.push({ name: '', quantity: 1, va: 0 });
    },
    removeOtherLoad(item) {
      const index = this.otherLoads.indexOf(item);
      if (index > -1) {
        this.otherLoads.splice(index, 1);
      }
    },
    calculateOtherLoads() {
      return this.otherLoads.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
    },

    // Total Load Calculation
    calculateTotalLoad() {
      const generalLoad = this.calculateGeneralLoad();
      const fixedAppliancesLoad = this.calculateFixedAppliancesLoad();
      const dryerLoad = this.calculateDryerLoad();
      const cookingEquipmentLoad = this.calculateCookingEquipmentLoad();
      const hvacLoad = this.calculateHVACLoad();
      const largestMotorLoad = this.calculateLargestMotorLoad();
      const otherLoads = this.calculateOtherLoads();

      // Sum up loads
      let subtotal = generalLoad + fixedAppliancesLoad + dryerLoad + cookingEquipmentLoad + otherLoads;

      // Apply demand factor: First 10,000 VA at 100%, remainder at 40%
      let demandLoad = subtotal;

      // Add HVAC load and largest motor load
      demandLoad += hvacLoad;
      demandLoad += largestMotorLoad;

      return Math.round(demandLoad);
    },

    // Amperage Calculation
    calculateAmperage() {
      const totalLoad = this.calculateTotalLoad();
      const voltage = parseInt(this.propertyData.voltage);
      return Math.round(totalLoad / voltage);
    },
    getServiceSizing(rating, wireType) {
      let wireSize = '';
      let conduitSize = '';
      let gecSize = '';

      // Wire and Conduit Sizing based on NEC Tables
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
            wireSize = '#1 CU';
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

        // GEC Sizing based on NEC Table 250.66
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
            wireSize = '350 kcmil AL';
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

        // GEC Sizing based on NEC Table 250.66
        gecSize = this.getGECSize(wireSize, 'ALUMINUM');
      }

      let serviceSizings = {
        wire: wireSize,
        conduit: conduitSize,
        gec: gecSize
      };

      return serviceSizings;
    },
    getGECSize(conductorSize, wireType) {
      // Mapping of wire sizes to order indices
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
        // GEC sizing for Copper based on NEC Table 250.66
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
        // GEC sizing for Aluminum based on NEC Table 250.66
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

    convertWireSizeToArea(conductorSize) {
      // Mapping of wire sizes to numerical area for comparison
      const wireSizeMap = {
        '#14': 14,
        '#12': 12,
        '#10': 10,
        '#8': 8,
        '#6': 6,
        '#4': 4,
        '#3': 3,
        '#2': 2,
        '#1': 1,
        '#1/0': 0, // 1/0
        '#2/0': -1, // 2/0
        '#3/0': -2, // 3/0
        '#4/0': -3, // 4/0
        '250 kcmil': 250,
        '350 kcmil': 350,
        '400 kcmil': 400,
        '500 kcmil': 500,
        '600 kcmil': 600,
        '700 kcmil': 700,
        '750 kcmil': 750,
        '900 kcmil': 900,
        '1000 kcmil': 1000,
        '1250 kcmil': 1250,
        '1500 kcmil': 1500,
        '1750 kcmil': 1750,
        '2000 kcmil': 2000
      };

      return wireSizeMap[conductorSize] || null;
    },
    getStandardBreakerSize(calculatedAmperage) {
      // NEC Table 240.6(a) Standard Breaker Sizes
      const standardSizes = [
        15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800,
        1000, 1200, 1600, 2000
      ];

      // Find the smallest standard size that is greater than or equal to calculatedAmperage
      for (let i = 0; i < standardSizes.length; i++) {
        if (standardSizes[i] >= calculatedAmperage) {
          return standardSizes[i];
        }
      }

      // If calculatedAmperage exceeds the maximum standard size
      return 'Over 2000 A - Custom sizing required';
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
