<!-- BatteryEstimatorForm.vue -->
<template>
  <v-card elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-4 flex-row">
        <h4 class="text-h4">Battery System Estimator</h4>
      </div>
      <v-form v-model="valid">
        <perfect-scrollbar class="perfectScroll">
          <v-row class="ma-0 pr-2">
            <v-col cols="12" md="12">
              <!-- Appliance Categories -->
              <div v-for="(category, index) in categories" :key="index" class="position-relative mt-3 pb-3">
                <div class="layer"></div>
                <div class="head d-flex p-3">
                  <div>
                    <b>{{ category.name }}</b>
                    <div>{{ category.description }}</div>
                  </div>
                  <div class="ml-auto d-none d-lg-block">
                    <div class="d-flex align-items-center text-secondary">
                      <div class="mx-3">
                        <span>Backup Energy:</span>
                        <strong class="px-1 text-dark"> {{ calculateCategoryBackupEnergy(category).toFixed(1) }} kWh </strong>
                      </div>
                      <div class="mx-3">
                        <span>Backup Power:</span>
                        <strong class="px-1 text-dark"> {{ calculateCategoryBackupPower(category).toFixed(1) }} kW </strong>
                      </div>
                      <div class="mx-3">
                        <span>Surge Power:</span>
                        <strong class="px-1 text-dark"> {{ calculateCategorySurgePower(category).toFixed(1) }} kW </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Split Appliances into Two Columns -->
                <v-row class="mb-8">
                  <!-- First Half of Appliances -->
                  <v-col cols="12" lg="6" class="mt-2">
                    <v-data-table :headers="headers" :items="firstHalf(category.appliances)" class="elevation-1" dense hide-default-footer>
                      <template v-slot:item.name="{ item }">
                        <div class="d-flex align-center">
                          <v-icon class="mr-2">{{ item.icon }}</v-icon>
                          <span>{{ item.name }}</span>
                        </div>
                      </template>

                      <template v-slot:item.backup="{ item }">
                        <v-switch color="primary" v-model="item.backup" hide-details></v-switch>
                      </template>

                      <template v-slot:item.quantity="{ item }">
                        <v-text-field
                          v-model.number="item.quantity"
                          type="number"
                          min="0"
                          variant="underlined"
                          dense
                          hide-details
                          style="max-width: 30px; min-width: 20px"
                        ></v-text-field>
                      </template>

                      <!-- New Usage Hours Column Template -->
                      <template v-slot:item.usageHours="{ item }">
                        <v-text-field
                          v-model.number="item.usageHours"
                          type="number"
                          min="0"
                          variant="underlined"
                          dense
                          hide-details
                          style="max-width: 40px; min-width: 30px"
                        ></v-text-field>
                      </template>

                      <template v-slot:item.edit="{ item }">
                        <v-btn icon elevation="0" size="small" @click="editApplianceByItem(item, category)">
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                      </template>

                      <template v-slot:item.remove="{ item }">
                        <v-btn icon elevation="0" size="small" @click="removeAppliance(category, item)">
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </v-data-table>
                  </v-col>

                  <!-- Second Half of Appliances -->
                  <v-col cols="12" lg="6" class="mt-2">
                    <v-data-table :headers="headers" :items="secondHalf(category.appliances)" class="elevation-1" dense hide-default-footer>
                      <template v-slot:item.name="{ item }">
                        <div class="d-flex align-center">
                          <v-icon class="mr-2">{{ item.icon }}</v-icon>
                          <span>{{ item.name }}</span>
                        </div>
                      </template>

                      <template v-slot:item.backup="{ item }">
                        <v-switch color="primary" v-model="item.backup" hide-details></v-switch>
                      </template>

                      <template v-slot:item.quantity="{ item }">
                        <v-text-field
                          v-model.number="item.quantity"
                          type="number"
                          min="0"
                          variant="underlined"
                          dense
                          hide-details
                          style="max-width: 30px; min-width: 20px"
                        ></v-text-field>
                      </template>

                      <!-- New Usage Hours Column Template for second table -->
                      <template v-slot:item.usageHours="{ item }">
                        <v-text-field
                          v-model.number="item.usageHours"
                          type="number"
                          min="0"
                          variant="underlined"
                          dense
                          hide-details
                          style="max-width: 40px; min-width: 30px"
                        ></v-text-field>
                      </template>

                      <template v-slot:item.edit="{ item }">
                        <v-btn icon elevation="0" size="small" @click="editApplianceByItem(item, category)">
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                      </template>

                      <template v-slot:item.remove="{ item }">
                        <v-btn icon elevation="0" size="small" @click="removeAppliance(category, item)">
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </v-data-table>
                  </v-col>

                  <v-col cols="12" class="d-flex justify-end mb-2">
                    <v-btn small color="primary" variant="tonal" @click="addAppliance(category)"> Add Appliance </v-btn>
                  </v-col>
                </v-row>
              </div>
            </v-col>
          </v-row>
        </perfect-scrollbar>
      </v-form>
    </v-card-text>

    <v-dialog v-model="showEditDialog" max-width="500px">
      <v-card>
        <v-card-title>Edit Appliance</v-card-title>
        <!-- Only render the form if editedAppliance is not null -->
        <v-card-text v-if="editedAppliance">
          <v-form ref="editForm">
            <v-text-field label="Name" v-model="editedAppliance.name"></v-text-field>
            <v-text-field label="Icon" v-model="editedAppliance.icon"></v-text-field>
            <v-text-field
              label="Power (W)"
              v-model.number="editedAppliance.power"
              type="number"
              min="0"
              :rules="[(v) => v >= 0 || 'Power must be non-negative']"
            ></v-text-field>
            <v-text-field
              label="Usage Hours"
              v-model.number="editedAppliance.usageHours"
              type="number"
              min="0"
              :rules="[(v) => v >= 0 || 'Usage Hours must be non-negative']"
            ></v-text-field>
            <v-text-field
              label="Surge Power (W)"
              v-model.number="editedAppliance.surgePower"
              type="number"
              min="0"
              :rules="[(v) => v >= 0 || 'Surge Power must be non-negative']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="closeEditDialog">Cancel</v-btn>
          <v-btn color="primary" text @click="saveAppliance" :disabled="!editedAppliance">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>

  <!-- Final Calculation -->
  <v-card elevation="0" class="innerCard maxWidth">
    <div class="mt-2">
      <v-card-title class="ml-2">Final Calculation</v-card-title>
      <v-card-text style="min-height: 84px">
        <div>
          <v-row class="d-flex justify-space-between align-center">
            <v-col class="py-0">
              <p>Total Backup Energy: {{ totalBackupEnergy.toFixed(1) }} kWh</p>
              <p>Total Backup Power: {{ totalBackupPower.toFixed(1) }} kW</p>
              <p>Total Surge Power: {{ totalSurgePower.toFixed(1) }} kW</p>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col class="py-0"></v-col>
            <v-divider vertical></v-divider>
            <v-col class="py-0"></v-col>
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
import pdfFonts from '@/utils/fonts';

export default {
  data() {
    return {
      valid: false,
      headers: [
        { title: '', key: 'name', sortable: false },
        { title: 'Backup', key: 'backup', sortable: false, align: 'center' },
        { title: 'Qty', key: 'quantity', sortable: false, align: 'center' },
        { title: 'Usage (hrs)', key: 'usageHours', sortable: false, align: 'center' },
        { title: 'Edit', key: 'edit', sortable: false, align: 'center' },
        { title: 'Remove', key: 'remove', sortable: false, align: 'center' }
      ],
      categories: [
        {
          name: 'Essential Appliances',
          description: 'Low consumption, Daily-use',
          appliances: [
            {
              id: 'lights',
              name: 'Lights',
              icon: 'mdi-lightbulb',
              backup: true,
              quantity: 13,
              power: 10,
              usageHours: 5,
              surgePower: 10
            },
            {
              id: 'television',
              name: 'Television',
              icon: 'mdi-television',
              backup: true,
              quantity: 2,
              power: 150,
              usageHours: 4,
              surgePower: 200
            },
            {
              id: 'refrigerator',
              name: 'Refrigerator',
              icon: 'mdi-fridge',
              backup: true,
              quantity: 1,
              power: 200,
              usageHours: 24,
              surgePower: 300
            },
            {
              id: 'wifi-router',
              name: 'Wifi Router',
              icon: 'mdi-wifi',
              backup: true,
              quantity: 1,
              power: 10,
              usageHours: 24,
              surgePower: 10
            },
            {
              id: 'laptop',
              name: 'Laptop / Home PC',
              icon: 'mdi-laptop',
              backup: true,
              quantity: 2,
              power: 50,
              usageHours: 6,
              surgePower: 65
            },
            {
              id: 'mobile-charger',
              name: 'Mobile Charger',
              icon: 'mdi-cellphone',
              backup: true,
              quantity: 4,
              power: 5,
              usageHours: 2,
              surgePower: 5
            },
            {
              id: 'microwave',
              name: 'Microwave',
              icon: 'mdi-microwave',
              backup: true,
              quantity: 1,
              power: 1000,
              usageHours: 0.5,
              surgePower: 1200
            },
            {
              id: 'coffee-machine',
              name: 'Coffee Machine',
              icon: 'mdi-coffee-maker',
              backup: true,
              quantity: 1,
              power: 800,
              usageHours: 0.5,
              surgePower: 1000
            }
          ]
        },
        {
          name: 'Large Appliances',
          description: 'High consumption, Regular-use',
          appliances: [
            {
              id: 'air-conditioner',
              name: 'Air Conditioner',
              icon: 'mdi-air-conditioner',
              backup: false,
              quantity: 1,
              power: 3500,
              usageHours: 8,
              surgePower: 4000
            },
            {
              id: 'pool-pump',
              name: 'Pool Pump',
              icon: 'mdi-pool',
              backup: false,
              quantity: 0,
              power: 1000,
              usageHours: 4,
              surgePower: 1200
            },
            {
              id: 'well-pump',
              name: 'Well Pump',
              icon: 'mdi-water-pump',
              backup: false,
              quantity: 0,
              power: 750,
              usageHours: 2,
              surgePower: 1000
            },
            {
              id: 'electric-dryer',
              name: 'Electric Dryer',
              icon: 'mdi-tumble-dryer',
              backup: false,
              quantity: 0,
              power: 3000,
              usageHours: 1,
              surgePower: 3500
            },
            {
              id: 'hair-dryer',
              name: 'Hair Dryer',
              icon: 'mdi-hair-dryer',
              backup: false,
              quantity: 1,
              power: 1500,
              usageHours: 0.5,
              surgePower: 1500
            },
            {
              id: 'dishwasher',
              name: 'Dishwasher',
              icon: 'mdi-dishwasher',
              backup: false,
              quantity: 2,
              power: 1800,
              usageHours: 1,
              surgePower: 2000
            },
            {
              id: 'vacuum-cleaner',
              name: 'Vacuum Cleaner',
              icon: 'mdi-vacuum',
              backup: false,
              quantity: 2,
              power: 1400,
              usageHours: 0.5,
              surgePower: 1500
            },
            {
              id: 'washing-machine',
              name: 'Washing Machine',
              icon: 'mdi-washing-machine',
              backup: false,
              quantity: 2,
              power: 500,
              usageHours: 1,
              surgePower: 600
            },
            {
              id: 'electric-oven',
              name: 'Electric Oven',
              icon: 'mdi-stove',
              backup: false,
              quantity: 0,
              power: 2000,
              usageHours: 1,
              surgePower: 2200
            },
            {
              id: 'heat-pump',
              name: 'Heat Pump',
              icon: 'mdi-heat-pump',
              backup: false,
              quantity: 0,
              power: 3000,
              usageHours: 6,
              surgePower: 3500
            }
          ]
        },
        {
          name: 'Heavy Appliances',
          description: 'Very high consumption, backup not recommended',
          appliances: [
            {
              id: 'electric-vehicle',
              name: 'Electric Vehicle',
              icon: 'mdi-car-electric',
              backup: false,
              quantity: 0,
              power: 7000,
              usageHours: 2,
              surgePower: 7500
            },
            {
              id: 'tankless-water-heater',
              name: 'Tankless Electric Water Heater',
              icon: 'mdi-water-boiler',
              backup: false,
              quantity: 0,
              power: 12000,
              usageHours: 1,
              surgePower: 12500
            }
          ]
        }
      ],
      showEditDialog: false,
      editedAppliance: null,
      editedCategory: null
    };
  },
  computed: {
    totalBackupEnergy() {
      return this.categories.reduce((total, category) => {
        return total + this.calculateCategoryBackupEnergy(category);
      }, 0);
    },
    totalBackupPower() {
      return this.categories.reduce((total, category) => {
        return total + this.calculateCategoryBackupPower(category);
      }, 0);
    },
    totalSurgePower() {
      return this.categories.reduce((total, category) => {
        return total + this.calculateCategorySurgePower(category);
      }, 0);
    }
  },
  methods: {
    firstHalf(appliances) {
      const half = Math.ceil(appliances.length / 2);
      return appliances.slice(0, half);
    },
    secondHalf(appliances) {
      const half = Math.ceil(appliances.length / 2);
      return appliances.slice(half);
    },
    calculateCategoryBackupEnergy(category) {
      return category.appliances.reduce((energy, appliance) => {
        if (appliance.backup) {
          return energy + (appliance.power * appliance.quantity * appliance.usageHours) / 1000;
        }
        return energy;
      }, 0);
    },
    calculateCategoryBackupPower(category) {
      return category.appliances.reduce((power, appliance) => {
        if (appliance.backup) {
          return power + (appliance.power * appliance.quantity) / 1000;
        }
        return power;
      }, 0);
    },
    calculateCategorySurgePower(category) {
      return category.appliances.reduce((sum, appliance) => {
        if (appliance.backup) {
          return sum + (appliance.surgePower * appliance.quantity) / 1000;
        }
        return sum;
      }, 0);
    },
    editApplianceByItem(item, category) {
      console.log('Editing appliance:', item, 'in category:', category);
      this.editedAppliance = { ...item };
      console.log(this.editedAppliance);
      this.editedCategory = category;
      this.showEditDialog = true;
    },
    closeEditDialog() {
      this.showEditDialog = false;
      // Wait until the dialog is fully closed
      this.$nextTick(() => {
        // Now it's safe to reset the edited data
        this.editedAppliance = null;
        this.editedCategory = null;
      });
    },
    saveAppliance() {
      console.log('Saving appliance. EditedAppliance:', this.editedAppliance, 'EditedCategory:', this.editedCategory);
      if (!this.editedAppliance || !this.editedCategory) {
        console.warn('No appliance or category is being edited');
        return;
      }

      const index = this.editedCategory.appliances.findIndex((a) => a.id === this.editedAppliance.id);
      if (index === -1) {
        console.warn('Could not find appliance by id:', this.editedAppliance.id);
        return;
      }

      this.editedCategory.appliances.splice(index, 1, { ...this.editedAppliance });
      this.closeEditDialog();
    },
    addAppliance(category) {
      const newId = 'new-appliance-' + Date.now();
      category.appliances.push({
        id: newId,
        name: 'New Appliance',
        icon: 'mdi-help-circle',
        backup: true,
        quantity: 1,
        power: 100,
        usageHours: 1,
        surgePower: 120
      });
    },
    removeAppliance(category, appliance) {
      const index = category.appliances.indexOf(appliance);
      if (index !== -1) {
        category.appliances.splice(index, 1);
      }
    },
    generatePDF() {
      const docDefinition = {
        content: [
          { text: 'Battery System Estimator', style: 'header' },
          {
            text:
              `Total Backup Energy: ${this.totalBackupEnergy.toFixed(1)} kWh\n` +
              `Total Backup Power: ${this.totalBackupPower.toFixed(1)} kW\n` +
              `Total Surge Power: ${this.totalSurgePower.toFixed(1)} kW`,
            style: 'summary',
            margin: [0, 5, 0, 10]
          },
          ...this.categories.reduce((acc, category) => {
            // Filter out appliances with quantity 0
            const filteredAppliances = category.appliances.filter((appliance) => appliance.quantity > 0 && appliance.backup);

            // If no appliances remain in this category, show a placeholder
            if (filteredAppliances.length === 0) {
              return acc.concat([
                { text: category.name, style: 'categoryHeader', margin: [0, 10, 0, 2] },
                { text: 'No appliances in this category.', fontSize: 10, italics: true, margin: [0, 0, 0, 5] }
              ]);
            }

            acc.push({ text: category.name, style: 'categoryHeader', margin: [0, 10, 0, 2] });

            const body = [];
            body.push([
              { text: 'Name', style: 'tableHeader' },
              { text: 'Backup', style: 'tableHeader', alignment: 'center' },
              { text: 'Qty', style: 'tableHeader', alignment: 'center' },
              { text: 'Power (W)', style: 'tableHeader', alignment: 'center' },
              { text: 'Usage (hrs)', style: 'tableHeader', alignment: 'center' },
              { text: 'Surge (W)', style: 'tableHeader', alignment: 'center' }
            ]);

            filteredAppliances.forEach((appliance) => {
              body.push([
                { text: appliance.name || '', style: 'tableCell' },
                { text: appliance.backup ? 'Yes' : 'No', style: 'tableCell', alignment: 'center' },
                { text: appliance.quantity.toString(), style: 'tableCell', alignment: 'center' },
                { text: appliance.power.toString(), style: 'tableCell', alignment: 'center' },
                { text: appliance.usageHours.toString(), style: 'tableCell', alignment: 'center' },
                { text: appliance.surgePower.toString(), style: 'tableCell', alignment: 'center' }
              ]);
            });

            acc.push({
              style: 'tableExample',
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: body
              },
              layout: 'lightHorizontalLines'
            });

            return acc;
          }, [])
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          summary: {
            fontSize: 11,
            margin: [0, 5, 0, 10]
          },
          categoryHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 2],
            color: '#2a8899'
          },
          categoryDescription: {
            fontSize: 10,
            italics: true,
            margin: [0, 0, 0, 5]
          },
          tableHeader: {
            bold: true,
            fillColor: '#eefaff',
            fontSize: 10,
            margin: [3, 3, 3, 3]
          },
          tableCell: {
            fontSize: 9,
            margin: [3, 3, 3, 3]
          },
          tableExample: {
            margin: [0, 3, 0, 5]
          }
        },
        defaultStyle: {
          fontSize: 10
        },
        pageMargins: [20, 20, 20, 20]
      };

      pdfMake.createPdf(docDefinition, null, pdfFonts).download('Battery_Estimator.pdf');
    }
  }
};
</script>

<style scoped>
.perfectScroll {
  width: 100%;
  height: calc(100vh - 326px);
}
</style>
