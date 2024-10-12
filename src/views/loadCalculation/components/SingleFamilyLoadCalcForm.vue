<template>
  <v-card elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-4">
        <h4 class="text-h4">Single Family Load Calculation</h4>
      </div>
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
                  <v-text-field class="mr-3" label="Year Built" v-model="propertyData.yearBuilt" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6" class="pa-0">
                  <v-text-field class="mr-3" label="Square Footage" v-model="propertyData.squareFootage" variant="outlined"></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6" class="pa-0">
                  <v-select
                    class="mr-3"
                    :items="propertyTypes"
                    label="Property Type"
                    v-model="propertyData.propertyType"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6" class="pa-0">
                  <v-select
                    class="mr-3"
                    :items="voltageOptions"
                    label="Voltage"
                    v-model="propertyData.voltage"
                    variant="outlined"
                  ></v-select>
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
                  <v-text-field label="Name" v-model="item.name" variant="outlined"></v-text-field>
                </v-col>
                <!-- Quantity Column -->
                <v-col class="py-0" cols="2">
                  <v-text-field
                    :label="'Quantity' + (item.units ? ' (' + item.units + ')' : '')"
                    v-model.number="item.quantity"
                    type="number"
                    variant="outlined"
                  ></v-text-field>
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
                  <v-icon small @click="removeGeneralLoadItem(item)">mdi-delete</v-icon>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                  <v-btn small color="primary" variant="tonal" @click="addGeneralLoadItem">Add Item</v-btn>
                  <p class="font-weight-bold">Total General Load: {{ calculateGeneralLoad() }} VA</p>
                </v-col>
              </v-row>
            </v-card-text>

            <!-- HVAC Load Section -->

            <v-card-title class="d-flex justify-space-between align-center"> HVAC Load </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row v-for="(item, index) in hvacLoadOptions" :key="index" class="align-center">
                <!-- Label Column -->
                <v-col class="py-0" cols="5">
                  <v-text-field label="Label" v-model="item.label" variant="outlined"></v-text-field>
                </v-col>
                <!-- Quantity Column -->
                <v-col class="py-0" cols="2">
                  <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined"></v-text-field>
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

            <!-- Other Electrical Load Section -->

            <v-card-title class="d-flex justify-space-between align-center"> Other Electrical Load </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-row v-for="(item, index) in otherElectricalLoadOptions" :key="index" class="align-center">
                <!-- Equipment Column -->
                <v-col class="py-0" cols="5">
                  <v-select
                    :items="equipmentOptions"
                    v-model="item.selectedEquipment"
                    label="Select Equipment"
                    variant="outlined"
                  ></v-select>
                </v-col>
                <!-- Quantity Column -->
                <v-col class="py-0" cols="2">
                  <v-text-field label="Quantity" v-model.number="item.quantity" type="number" variant="outlined"></v-text-field>
                </v-col>
                <!-- VA per Unit Column -->
                <v-col class="py-0" cols="2">
                  <v-text-field
                    label="VA per Unit"
                    :value="item.selectedEquipment ? item.selectedEquipment.va : ''"
                    type="number"
                    variant="outlined"
                    min="0"
                  ></v-text-field>
                </v-col>
                <!-- Total VA Column -->
                <v-col class="py-0" cols="2">
                  <v-text-field
                    label="Total VA"
                    :value="calculateEquipmentTotalVA(item)"
                    type="number"
                    variant="plain"
                    readonly
                    placeholder="0"
                    persistent-placeholder
                  ></v-text-field>
                </v-col>
                <!-- Delete Icon -->
                <v-col cols="1" class="text-center mb-5">
                  <v-icon small @click="removeOtherLoadItem(item)">mdi-delete</v-icon>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex justify-space-between align-center px-0">
                  <v-btn small color="primary" variant="tonal" @click="addOtherLoadItem">Add Item</v-btn>
                  <p class="font-weight-bold">Total Other Electrical Load: {{ calculateOtherLoad() }} VA</p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-col>
        </v-row>
      </perfect-scrollbar>
    </v-card-text>
  </v-card>
  <v-card elevation="0" class="innerCard maxWidth">
    <div class="mt-2">
      <!-- Final Load Calculation -->
      <v-card-title>Final Calculation</v-card-title>
      <v-card-text>
        <p>Total Calculated Load: {{ calculateTotalLoad() }} VA</p>
        <p>Calculated Amperage: {{ calculateAmperage() }} A</p>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      address: '',
      propertyData: {
        yearBuilt: '',
        squareFootage: '',
        propertyType: 'Single Dwelling Unit',
        voltage: '120/240V'
      },
      propertyTypes: ['Single Dwelling Unit', 'Multi-Family', 'Commercial'],
      voltageOptions: ['120/240V', '208Y/120V', '480Y/277V'],
      generalLoadItems: [
        { name: 'Lighting', quantity: 0, va: 3, units: 'sqft' },
        { name: 'Small Appliance', quantity: 2, va: 1500, units: '' },
        { name: 'Laundry', quantity: 1, va: 1500, units: '' }
      ],
      hvacLoadOptions: [
        { label: 'Electric Space Heater', quantity: 0, va: 1500 },
        { label: 'Heat Pump / Furnace', quantity: 0, va: 6000 },
        { label: 'Air Conditioner', quantity: 0, va: 4000 }
      ],
      otherElectricalLoadOptions: [{ selectedEquipment: null, quantity: 0 }],
      equipmentOptions: [
        { label: 'Bath / Laundry Fan - 50 W', va: 50 },
        { label: 'Dishwasher - 1,200 W', va: 1200 },
        { label: 'Disposal - 600 W', va: 600 }
      ]
    };
  },
  methods: {
    addGeneralLoadItem() {
      this.generalLoadItems.push({ name: '', quantity: 0, va: 0, units: '' });
    },
    removeGeneralLoadItem(item) {
      const index = this.generalLoadItems.indexOf(item);
      if (index > -1) {
        this.generalLoadItems.splice(index, 1);
      }
    },
    addHVACLoadItem() {
      this.hvacLoadOptions.push({ label: '', quantity: 0, va: 0 });
    },
    removeHVACLoadItem(item) {
      const index = this.hvacLoadOptions.indexOf(item);
      if (index > -1) {
        this.hvacLoadOptions.splice(index, 1);
      }
    },
    addOtherLoadItem() {
      this.otherElectricalLoadOptions.push({
        selectedEquipment: null,
        quantity: 0
      });
    },
    removeOtherLoadItem(item) {
      const index = this.otherElectricalLoadOptions.indexOf(item);
      if (index > -1) {
        this.otherElectricalLoadOptions.splice(index, 1);
      }
    },
    calculateItemTotalVA(item) {
      return item.quantity * item.va || 0;
    },
    calculateEquipmentTotalVA(item) {
      return item.selectedEquipment ? item.selectedEquipment.va * item.quantity : 0;
    },
    calculateGeneralLoad() {
      return this.generalLoadItems.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
    },
    calculateHVACLoad() {
      return this.hvacLoadOptions.reduce((total, item) => total + this.calculateItemTotalVA(item), 0);
    },
    calculateOtherLoad() {
      return this.otherElectricalLoadOptions.reduce((total, item) => total + this.calculateEquipmentTotalVA(item), 0);
    },
    calculateTotalLoad() {
      return this.calculateGeneralLoad() + this.calculateHVACLoad() + this.calculateOtherLoad();
    },
    calculateAmperage() {
      const totalLoad = this.calculateTotalLoad();
      return Math.round(totalLoad / 240);
    }
  }
};
</script>

<style scoped>
.perfectScroll {
  width: 100%;
  height: calc(100vh - 318px);
}
</style>
