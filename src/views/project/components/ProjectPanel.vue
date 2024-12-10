<script setup lang="ts">
// Icon Imports
import {
  DeviceFloppyIcon,
  DownloadIcon,
  SquarePlusIcon,
  LineIcon,
  LineDashedIcon,
  XIcon,
  Category2Icon,
  CircuitGroundIcon,
  ArrowBackUpIcon,
  ArrowForwardUpIcon,
  Focus2Icon,
  GridPatternIcon,
  CubePlusIcon
} from 'vue-tabler-icons';
import {
  IconRoute2,
  IconSquarePlus2,
  IconLetterCase,
  IconPointFilled,
  IconFileTypeSvg,
  IconFileTypePdf,
  IconFileArrowLeft
} from '@tabler/icons-vue';
import { useSvgStore } from '@/stores/svgStore';
import { ref } from 'vue';
import { supabase } from '@/utils/supabaseClient';
import { useHistoryStore } from '@/stores/history';
import { DeleteBlockCommand, DeleteLineCommand, AddBlockCommand } from '@/commands';

import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();

const store = useSvgStore();
const historyStore = useHistoryStore();

defineEmits(['openBlockDialog', 'openImportSvgDialog']);
const props = defineProps(['project']);
const project = props.project;

const error = ref(null);

function setLine(lineId) {
  store.endDrawing();
  store.setCurrentLineId(lineId);
  store.startDrawing();
}

const setRectangleTool = () => {
  store.endDrawing();
  store.startRectangleTool();
};

const startTextTool = () => {
  store.endDrawing();
  store.startTextTool();
};

const startConnectionPointsTool = (type) => {
  store.endDrawing();
  store.startConnectionPointsTool(type);
};

const deleteObject = () => {
  if (store.selectedBlock) {
    historyStore.executeCommand(new DeleteBlockCommand(store.selectedBlock, store));
  }
  if (store.selectedLine) {
    historyStore.executeCommand(new DeleteLineCommand(store.selectedLine, store));
  }
};

const isActive = (tool: string) => {
  return store.activeTool === tool;
};

const { addBlock } = store;

const addNewBlock = () => {
  const newBlock = {
    object: 'block',
    id: Date.now(),
    x: 40,
    y: 40,
    width: 80,
    height: 80,
    color: '#f0f0f0',
    content:
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160.2" viewBox="0 0 800 1602">\
  <defs>\
    <style>\
      .cls-1 {\
        fill: none;\
        stroke-width: 17px;\
      }\
      .cls-2 {\
        fill: none;\
        stroke-width: 5px;\
      }\
      .cls-1, .cls-2, .cls-3 {\
        stroke: #000;\
      }\
      .cls-2, .cls-3 {\
        fill-rule: evenodd;\
      }\
      .cls-3 {\
        stroke-width: 1px;\
      }\
    </style>\
  </defs>\
  <rect id="SHELL" class="cls-1" width="800" height="1602"/>\
  <path id="DISCONNECT" class="cls-2" d="M289.572,97.9H797.136V227.757H289.572V97.9Z"/>\
  <path id="DC_DISCONNECT" data-name="DC DISCONNECT" class="cls-3" d="M413.605,156.089a12.35,12.35,0,0,0-2.741-4.56,11.922,11.922,0,0,0-4.481-2.886,18.682,18.682,0,0,0-6.543-1h-6.75a1.636,1.636,0,0,0-1,.358,1.486,1.486,0,0,0-.472,1.259V175.9a1.488,1.488,0,0,0,.472,1.259,1.635,1.635,0,0,0,1,.357H399.4a20.411,20.411,0,0,0,6.589-.946,11.938,11.938,0,0,0,4.665-2.852,12.322,12.322,0,0,0,2.892-4.8,20.969,20.969,0,0,0,.99-6.776A18.324,18.324,0,0,0,413.605,156.089Zm-3.893,11.487a9.555,9.555,0,0,1-1.97,3.706,7.941,7.941,0,0,1-3.271,2.194,14.128,14.128,0,0,1-4.815.715h-4.078V150.94h4.032a12.729,12.729,0,0,1,5.045.854,8.693,8.693,0,0,1,3.237,2.379,9.7,9.7,0,0,1,1.877,3.613,16.3,16.3,0,0,1,.6,4.514A18.806,18.806,0,0,1,409.712,167.576Zm30.8,4.838a2.429,2.429,0,0,0-.1-0.543,0.49,0.49,0,0,0-.186-0.266,0.533,0.533,0,0,0-.278-0.069,1.847,1.847,0,0,0-.949.439,17.894,17.894,0,0,1-1.54.981,12.165,12.165,0,0,1-2.27.982,9.988,9.988,0,0,1-3.115.438,9.109,9.109,0,0,1-3.775-.75,7.351,7.351,0,0,1-2.814-2.217,10.44,10.44,0,0,1-1.76-3.648,20.753,20.753,0,0,1,.023-10.113,11.518,11.518,0,0,1,1.8-3.775,7.645,7.645,0,0,1,2.791-2.344,8.153,8.153,0,0,1,3.625-.8,9.667,9.667,0,0,1,3.138.451,12.135,12.135,0,0,1,2.223.992,14.712,14.712,0,0,1,1.494.993,1.724,1.724,0,0,0,.9.451,0.48,0.48,0,0,0,.313-0.1,0.825,0.825,0,0,0,.22-0.324,2.2,2.2,0,0,0,.139-0.542,5.622,5.622,0,0,0,.047-0.785,6.373,6.373,0,0,0-.035-0.716,3.858,3.858,0,0,0-.092-0.52,1.627,1.627,0,0,0-.15-0.381,2.756,2.756,0,0,0-.4-0.473,6.256,6.256,0,0,0-1.117-.8,10.328,10.328,0,0,0-1.843-.854,16.152,16.152,0,0,0-2.258-.612,12.912,12.912,0,0,0-2.511-.242,13.065,13.065,0,0,0-5.333,1.062,11.475,11.475,0,0,0-4.136,3.082,14.428,14.428,0,0,0-2.684,4.93,23.514,23.514,0,0,0-.069,13.034,13.063,13.063,0,0,0,2.534,4.676,10.581,10.581,0,0,0,3.986,2.863,13.555,13.555,0,0,0,5.241.97,14.421,14.421,0,0,0,3.1-.312,15.272,15.272,0,0,0,2.511-.762,11.629,11.629,0,0,0,1.831-.923,6.666,6.666,0,0,0,.968-0.705,1.987,1.987,0,0,0,.322-0.392,1.616,1.616,0,0,0,.15-0.37,2.735,2.735,0,0,0,.081-0.484q0.023-.278.023-0.647C440.548,172.937,440.536,172.644,440.513,172.414Zm37.943-16.325a12.35,12.35,0,0,0-2.741-4.56,11.922,11.922,0,0,0-4.481-2.886,18.682,18.682,0,0,0-6.543-1h-6.75a1.636,1.636,0,0,0-1,.358,1.486,1.486,0,0,0-.472,1.259V175.9a1.488,1.488,0,0,0,.472,1.259,1.635,1.635,0,0,0,1,.357h6.312a20.411,20.411,0,0,0,6.589-.946,11.938,11.938,0,0,0,4.665-2.852,12.322,12.322,0,0,0,2.892-4.8,20.969,20.969,0,0,0,.99-6.776A18.324,18.324,0,0,0,478.456,156.089Zm-3.893,11.487a9.542,9.542,0,0,1-1.97,3.706,7.941,7.941,0,0,1-3.271,2.194,14.128,14.128,0,0,1-4.815.715h-4.078V150.94h4.032a12.729,12.729,0,0,1,5.045.854,8.693,8.693,0,0,1,3.237,2.379,9.7,9.7,0,0,1,1.877,3.613,16.3,16.3,0,0,1,.6,4.514A18.77,18.77,0,0,1,474.563,167.576Zm14.894-19.337a0.578,0.578,0,0,0-.092-0.324,0.624,0.624,0,0,0-.323-0.219,3.525,3.525,0,0,0-.61-0.139,6.651,6.651,0,0,0-.957-0.057,6.251,6.251,0,0,0-.91.057,3.893,3.893,0,0,0-.622.139,0.692,0.692,0,0,0-.345.219,0.529,0.529,0,0,0-.1.324v28.677a0.572,0.572,0,0,0,.092.323,0.615,0.615,0,0,0,.323.22,3.426,3.426,0,0,0,.622.138,7.817,7.817,0,0,0,1.9,0,3.445,3.445,0,0,0,.61-0.138,0.62,0.62,0,0,0,.323-0.22,0.572,0.572,0,0,0,.092-0.323V148.239ZM512.8,166.052a7.57,7.57,0,0,0-1.543-2.262,10.418,10.418,0,0,0-2.177-1.663q-1.221-.7-2.488-1.293t-2.488-1.166a13.569,13.569,0,0,1-2.177-1.27,5.875,5.875,0,0,1-1.532-1.593,3.89,3.89,0,0,1-.576-2.147,4.373,4.373,0,0,1,.3-1.617,3.53,3.53,0,0,1,.9-1.316,4.456,4.456,0,0,1,1.52-.889,6.343,6.343,0,0,1,2.166-.335,8.061,8.061,0,0,1,2.407.335,11.793,11.793,0,0,1,1.855.739q0.783,0.405,1.324.727a1.853,1.853,0,0,0,.8.324,0.445,0.445,0,0,0,.288-0.1,0.67,0.67,0,0,0,.2-0.323,2.931,2.931,0,0,0,.1-0.543,7.042,7.042,0,0,0,.034-0.739q0-.438-0.023-0.716a3.228,3.228,0,0,0-.069-0.473,1.307,1.307,0,0,0-.115-0.323,1.76,1.76,0,0,0-.288-0.347,4.1,4.1,0,0,0-.91-0.577,10.55,10.55,0,0,0-1.578-.646,13.447,13.447,0,0,0-1.889-.462,11.634,11.634,0,0,0-1.993-.173,12.1,12.1,0,0,0-3.606.519,8.433,8.433,0,0,0-2.879,1.512,6.862,6.862,0,0,0-1.889,2.46,7.829,7.829,0,0,0-.68,3.336,7.577,7.577,0,0,0,.588,3.129,7.836,7.836,0,0,0,1.532,2.274,10.42,10.42,0,0,0,2.142,1.686,26.711,26.711,0,0,0,2.465,1.3q1.267,0.59,2.477,1.155a13.424,13.424,0,0,1,2.154,1.246,5.838,5.838,0,0,1,1.52,1.582,3.944,3.944,0,0,1,.576,2.171,5.07,5.07,0,0,1-.415,2.1,4.23,4.23,0,0,1-1.186,1.558,5.553,5.553,0,0,1-1.843.982,7.668,7.668,0,0,1-2.361.346,10.17,10.17,0,0,1-3.007-.4,14.712,14.712,0,0,1-2.223-.866,14.346,14.346,0,0,1-1.509-.854,1.879,1.879,0,0,0-.91-0.393,0.624,0.624,0,0,0-.322.081,0.594,0.594,0,0,0-.231.289,2.072,2.072,0,0,0-.138.542,6.336,6.336,0,0,0-.046.843,4.133,4.133,0,0,0,.127,1.143,1.687,1.687,0,0,0,.391.7,4.5,4.5,0,0,0,.945.67,10.943,10.943,0,0,0,1.681.762,15.2,15.2,0,0,0,2.281.623,14.287,14.287,0,0,0,2.776.254,13.4,13.4,0,0,0,4-.577,9.288,9.288,0,0,0,3.226-1.72,8.035,8.035,0,0,0,2.142-2.783,8.684,8.684,0,0,0,.772-3.74A7.454,7.454,0,0,0,512.8,166.052Zm26.125,6.362a2.429,2.429,0,0,0-.1-0.543,0.49,0.49,0,0,0-.186-0.266,0.533,0.533,0,0,0-.278-0.069,1.847,1.847,0,0,0-.949.439,17.894,17.894,0,0,1-1.54.981,12.165,12.165,0,0,1-2.27.982,9.988,9.988,0,0,1-3.115.438,9.106,9.106,0,0,1-3.775-.75,7.351,7.351,0,0,1-2.814-2.217,10.44,10.44,0,0,1-1.76-3.648,20.753,20.753,0,0,1,.023-10.113,11.518,11.518,0,0,1,1.795-3.775,7.645,7.645,0,0,1,2.791-2.344,8.153,8.153,0,0,1,3.625-.8,9.667,9.667,0,0,1,3.138.451,12.135,12.135,0,0,1,2.223.992,14.712,14.712,0,0,1,1.494.993,1.724,1.724,0,0,0,.9.451,0.48,0.48,0,0,0,.313-0.1,0.825,0.825,0,0,0,.22-0.324,2.2,2.2,0,0,0,.139-0.542,5.639,5.639,0,0,0,.046-0.785,6.4,6.4,0,0,0-.034-0.716,3.858,3.858,0,0,0-.092-0.52,1.627,1.627,0,0,0-.15-0.381,2.756,2.756,0,0,0-.4-0.473,6.256,6.256,0,0,0-1.117-.8,10.328,10.328,0,0,0-1.843-.854,16.152,16.152,0,0,0-2.258-.612,12.912,12.912,0,0,0-2.511-.242,13.074,13.074,0,0,0-5.334,1.062,11.48,11.48,0,0,0-4.135,3.082,14.411,14.411,0,0,0-2.684,4.93,23.514,23.514,0,0,0-.069,13.034,13.063,13.063,0,0,0,2.534,4.676,10.581,10.581,0,0,0,3.986,2.863,13.555,13.555,0,0,0,5.241.97,14.421,14.421,0,0,0,3.1-.312,15.272,15.272,0,0,0,2.511-.762,11.629,11.629,0,0,0,1.831-.923,6.725,6.725,0,0,0,.968-0.705,1.987,1.987,0,0,0,.322-0.392,1.662,1.662,0,0,0,.15-0.37,2.735,2.735,0,0,0,.081-0.484q0.023-.278.023-0.647C538.965,172.937,538.953,172.644,538.93,172.414ZM567.981,155.8a12.335,12.335,0,0,0-2.419-4.711,10.4,10.4,0,0,0-4.066-2.9,15.2,15.2,0,0,0-5.737-.992,15.046,15.046,0,0,0-5.967,1.1,11.346,11.346,0,0,0-4.262,3.117,13.386,13.386,0,0,0-2.557,4.907,22.63,22.63,0,0,0-.852,6.419,24.659,24.659,0,0,0,.783,6.534,12.486,12.486,0,0,0,2.384,4.757,10.239,10.239,0,0,0,4.055,2.921,15.323,15.323,0,0,0,5.817,1,15.046,15.046,0,0,0,5.967-1.1,11.1,11.1,0,0,0,4.25-3.14,13.673,13.673,0,0,0,2.546-4.953,23.225,23.225,0,0,0,.852-6.534A23.677,23.677,0,0,0,567.981,155.8Zm-3.859,11.3a11.12,11.12,0,0,1-1.541,3.821,7.871,7.871,0,0,1-2.853,2.621,9.016,9.016,0,0,1-4.372.97,9.516,9.516,0,0,1-4.36-.889,7.077,7.077,0,0,1-2.773-2.494,10.854,10.854,0,0,1-1.472-3.821,25.051,25.051,0,0,1-.437-4.849,21.238,21.238,0,0,1,.471-4.537,10.77,10.77,0,0,1,1.565-3.775,8.135,8.135,0,0,1,2.842-2.586,8.808,8.808,0,0,1,4.325-.97,9.385,9.385,0,0,1,4.326.9,7.231,7.231,0,0,1,2.8,2.506,10.865,10.865,0,0,1,1.5,3.786,23.457,23.457,0,0,1,.449,4.722A22.1,22.1,0,0,1,564.122,167.1Zm33.451-18.8a0.51,0.51,0,0,0-.1-0.3,0.782,0.782,0,0,0-.316-0.243,2.026,2.026,0,0,0-.608-0.15,8.14,8.14,0,0,0-.923-0.046,8.6,8.6,0,0,0-.985.046,2.163,2.163,0,0,0-.608.15,0.782,0.782,0,0,0-.328.243,0.509,0.509,0,0,0-.1.3v16.209q0,1.824.012,3.8t0.057,3.8h-0.023q-0.534-1.085-1.08-2.158t-1.1-2.182q-0.557-1.109-1.158-2.252t-1.247-2.343l-6.991-13.115a9.951,9.951,0,0,0-.723-1.189,3.263,3.263,0,0,0-.714-0.739,2.4,2.4,0,0,0-.832-0.381,4.862,4.862,0,0,0-1.153-.116h-1.95a1.858,1.858,0,0,0-1.141.393,1.54,1.54,0,0,0-.523,1.316v27.569a0.564,0.564,0,0,0,.1.312,0.614,0.614,0,0,0,.316.231,3.125,3.125,0,0,0,.595.138,7.982,7.982,0,0,0,1.921,0,3.46,3.46,0,0,0,.608-0.138,0.616,0.616,0,0,0,.328-0.231,0.564,0.564,0,0,0,.1-0.312V158.883q0-1.709-.023-3.44t-0.069-3.4h0.046q0.624,1.363,1.348,2.806t1.438,2.759l9.094,16.994a12.092,12.092,0,0,0,.885,1.478,4.653,4.653,0,0,0,.834.912,2.434,2.434,0,0,0,.882.462,4.157,4.157,0,0,0,1.084.127h1.31a2.148,2.148,0,0,0,.62-0.093,1.536,1.536,0,0,0,.965-0.831,1.807,1.807,0,0,0,.155-0.785V148.308Zm30.455,0a0.509,0.509,0,0,0-.1-0.3,0.789,0.789,0,0,0-.316-0.243,2.026,2.026,0,0,0-.608-0.15,8.146,8.146,0,0,0-.924-0.046,8.6,8.6,0,0,0-.984.046,2.163,2.163,0,0,0-.608.15,0.782,0.782,0,0,0-.328.243,0.509,0.509,0,0,0-.1.3v16.209q0,1.824.011,3.8t0.058,3.8h-0.023q-0.534-1.085-1.08-2.158t-1.1-2.182q-0.557-1.109-1.158-2.252t-1.247-2.343l-6.991-13.115a10.084,10.084,0,0,0-.723-1.189,3.284,3.284,0,0,0-.714-0.739,2.4,2.4,0,0,0-.832-0.381,4.862,4.862,0,0,0-1.153-.116h-1.95a1.862,1.862,0,0,0-1.142.393,1.542,1.542,0,0,0-.523,1.316v27.569a0.565,0.565,0,0,0,.1.312,0.61,0.61,0,0,0,.316.231,3.106,3.106,0,0,0,.6.138,7.982,7.982,0,0,0,1.921,0,3.446,3.446,0,0,0,.607-0.138,0.615,0.615,0,0,0,.329-0.231,0.564,0.564,0,0,0,.1-0.312V158.883q0-1.709-.023-3.44t-0.069-3.4h0.046q0.624,1.363,1.348,2.806t1.438,2.759l9.094,16.994a12.092,12.092,0,0,0,.885,1.478,4.653,4.653,0,0,0,.834.912,2.438,2.438,0,0,0,.881.462,4.165,4.165,0,0,0,1.085.127h1.31a2.136,2.136,0,0,0,.619-0.093,1.535,1.535,0,0,0,.966-0.831,1.822,1.822,0,0,0,.154-0.785V148.308Zm24.466,26.8a1.413,1.413,0,0,0-.161-0.508,0.814,0.814,0,0,0-.265-0.289,0.628,0.628,0,0,0-.334-0.092H639.916V163.524h10a0.691,0.691,0,0,0,.334-0.081,0.658,0.658,0,0,0,.254-0.265,1.455,1.455,0,0,0,.149-0.485,4.761,4.761,0,0,0,.046-0.716,5.446,5.446,0,0,0-.046-0.762,1.492,1.492,0,0,0-.149-0.508,0.867,0.867,0,0,0-.254-0.289,0.574,0.574,0,0,0-.334-0.1h-10V150.94h11.657a0.628,0.628,0,0,0,.334-0.092,0.657,0.657,0,0,0,.242-0.289,2.153,2.153,0,0,0,.15-0.508,4.085,4.085,0,0,0,.057-0.727,4.408,4.408,0,0,0-.057-0.774,2.4,2.4,0,0,0-.15-0.519,0.642,0.642,0,0,0-.242-0.3,0.62,0.62,0,0,0-.334-0.093H637.428a1.632,1.632,0,0,0-1,.358,1.487,1.487,0,0,0-.473,1.259V175.9a1.488,1.488,0,0,0,.473,1.259,1.63,1.63,0,0,0,1,.357h14.306a0.62,0.62,0,0,0,.334-0.092,0.791,0.791,0,0,0,.265-0.3,1.539,1.539,0,0,0,.161-0.52,4.985,4.985,0,0,0,.046-0.727A5.368,5.368,0,0,0,652.494,175.1Zm25.814-2.69a2.429,2.429,0,0,0-.1-0.543,0.49,0.49,0,0,0-.186-0.266,0.533,0.533,0,0,0-.278-0.069,1.847,1.847,0,0,0-.949.439,17.894,17.894,0,0,1-1.54.981,12.165,12.165,0,0,1-2.27.982,9.988,9.988,0,0,1-3.115.438,9.106,9.106,0,0,1-3.775-.75,7.351,7.351,0,0,1-2.814-2.217,10.44,10.44,0,0,1-1.76-3.648,20.753,20.753,0,0,1,.023-10.113,11.518,11.518,0,0,1,1.8-3.775,7.645,7.645,0,0,1,2.791-2.344,8.153,8.153,0,0,1,3.625-.8,9.667,9.667,0,0,1,3.138.451,12.135,12.135,0,0,1,2.223.992,14.712,14.712,0,0,1,1.494.993,1.724,1.724,0,0,0,.9.451,0.48,0.48,0,0,0,.313-0.1,0.825,0.825,0,0,0,.22-0.324,2.2,2.2,0,0,0,.139-0.542,5.639,5.639,0,0,0,.046-0.785,6.4,6.4,0,0,0-.034-0.716,3.858,3.858,0,0,0-.092-0.52,1.627,1.627,0,0,0-.15-0.381,2.756,2.756,0,0,0-.4-0.473,6.273,6.273,0,0,0-1.118-.8,10.263,10.263,0,0,0-1.843-.854,16.1,16.1,0,0,0-2.257-.612,12.912,12.912,0,0,0-2.511-.242,13.074,13.074,0,0,0-5.334,1.062,11.48,11.48,0,0,0-4.135,3.082,14.411,14.411,0,0,0-2.684,4.93,23.514,23.514,0,0,0-.069,13.034,13.063,13.063,0,0,0,2.534,4.676,10.581,10.581,0,0,0,3.986,2.863,13.551,13.551,0,0,0,5.241.97,14.4,14.4,0,0,0,3.1-.312,15.256,15.256,0,0,0,2.512-.762,11.629,11.629,0,0,0,1.831-.923,6.725,6.725,0,0,0,.968-0.705,1.987,1.987,0,0,0,.322-0.392,1.662,1.662,0,0,0,.15-0.37,2.735,2.735,0,0,0,.081-0.484q0.022-.278.023-0.647C678.343,172.937,678.331,172.644,678.308,172.414Zm24.155-23.841a1.773,1.773,0,0,0-.15-0.542,0.7,0.7,0,0,0-.253-0.3,0.62,0.62,0,0,0-.334-0.093H680.992a0.62,0.62,0,0,0-.334.093,0.636,0.636,0,0,0-.242.3,2.287,2.287,0,0,0-.15.542,4.671,4.671,0,0,0-.057.774,4.437,4.437,0,0,0,.057.762,2.059,2.059,0,0,0,.15.519,0.645,0.645,0,0,0,.242.289,0.62,0.62,0,0,0,.334.092h8.386v25.907a0.564,0.564,0,0,0,.092.323,0.612,0.612,0,0,0,.322.22,3.446,3.446,0,0,0,.622.138,7.817,7.817,0,0,0,1.9,0,3.424,3.424,0,0,0,.61-0.138,0.615,0.615,0,0,0,.323-0.22,0.572,0.572,0,0,0,.092-0.323V151.009h8.386a0.62,0.62,0,0,0,.334-0.092,0.719,0.719,0,0,0,.253-0.289,1.607,1.607,0,0,0,.15-0.519,5.426,5.426,0,0,0,.046-0.762A5.712,5.712,0,0,0,702.463,148.573Z"/>\
</svg>\
',
    connectionPoints: [
      { id: 'cp1', x: 40, y: 0 }, // Top-center
      { id: 'cp2', x: 40, y: 80 }, // Bottom-center
      { id: 'cp3', x: 0, y: 40 }, // Left-center
      { id: 'cp4', x: 80, y: 40 } // Right-center
    ]
  };
  historyStore.executeCommand(new AddBlockCommand(newBlock, store));
};

const serializeState = () => {
  return store.serializeState();
};

const svgToDataUrl = (svgElement: any) => {
  return store.svgToDataUrl(svgElement);
};

const undo = () => {
  return historyStore.undo();
};

const redo = () => {
  return historyStore.redo();
};

const centerSvg = () => {
  return store.centerSVG();
};

const downloadSVG = async () => {
  return await store.downloadSVG();
};

const downloadPDF = async () => {
  return await store.downloadPDF();
};

const fitSVGToExtent = () => {
  return store.fitSVGToExtent();
};

const toggleGrid = () => {
  return store.toggleGrid();
};

const saveDrawing = async () => {
  try {
    // Serialize the current page before saving
    store.serializeCurrentPage();

    // Get all serialized pages
    const allPages = store.pageStates;

    // Convert to SVG or other format as needed
    // const project_svg = allPages.map((pageState) => {
    //   // Convert each page's serialized state to SVG data URL
    //   return svgToDataUrl(store.deserializeState(pageState));
    // });

    const project_svg = svgToDataUrl(store.svg);

    // Update the project in the database
    const { data, error } = await supabase
      .schema('interconnectify')
      .from('projects')
      .update({ drawing: allPages, project_svg })
      .eq('id', project.id);

    if (error) {
      throw error;
    }

    // Mark history as saved, show success message, etc.
    historyStore.markSaved();
    snackbarStore.showSnackbar('Drawing Saved Successfully', 'success');
  } catch (err) {
    // Handle errors
    error.value = err.message;
    snackbarStore.showSnackbar('Error Saving Drawing', 'error');
  }
};

const saveDrawingAsBlock = async () => {
  try {
    // Serialize the current page before saving
    store.serializeCurrentPage();

    // Get all serialized pages
    const allPages = store.pageStates;

    // Convert to SVG or other format as needed
    // const project_svg = allPages.map((pageState) => {
    //   // Convert each page's serialized state to SVG data URL
    //   return svgToDataUrl(store.deserializeState(pageState));
    // });

    const block_svg = svgToDataUrl(store.svg);

    // Update the project in the database
    const { data, error } = await supabase
      .schema('interconnectify')
      .from('blocks')
      .update({ drawing: allPages, block_svg })
      .eq('id', project.id);

    if (error) {
      throw error;
    }

    // Mark history as saved, show success message, etc.
    historyStore.markSaved();
    snackbarStore.showSnackbar('Drawing Saved Successfully', 'success');
  } catch (err) {
    // Handle errors
    error.value = err.message;
    snackbarStore.showSnackbar('Error Saving Drawing', 'error');
  }
};

// const saveDrawingAsBlock = async () => {
//   try {
//     const drawing = serializeState();
//     const { data, error: updateError } = await supabase.schema('interconnectify').from('blocks').update({ drawing }).eq('id', project.id);

//     if (updateError) {
//       throw updateError;
//     }

//     snackbarStore.showSnackbar('Drawing Saved Successfully', 'success');
//   } catch (err: any) {
//     error.value = err.message;
//     snackbarStore.showSnackbar('Error Saving Drawing', 'error');
//   }
//   try {
//     const block_svg = svgToDataUrl(store.svg);
//     const { data, error: updateError } = await supabase.schema('interconnectify').from('blocks').update({ block_svg }).eq('id', project.id);

//     if (updateError) {
//       throw updateError;
//     }
//     historyStore.markSaved();
//     snackbarStore.showSnackbar('Drawing Saved Successfully', 'success');
//   } catch (err: any) {
//     error.value = err.message;
//     snackbarStore.showSnackbar('Error Saving Drawing', 'error');
//   }
// };
</script>

<template>
  <v-toolbar elevation="0" height="40" class="mt-0" style="z-index: 1; background: transparent">
    <v-btn class="text-secondary ml-2" icon outlined rounded="sm" variant="flat" @click="downloadSVG">
      <IconFileTypeSvg size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn class="text-secondary ml-2 mr-6" icon outlined rounded="sm" variant="flat" @click="downloadPDF">
      <IconFileTypePdf size="20" stroke-width="1.5" />
    </v-btn>
    <v-divider vertical></v-divider>
    <!-- <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn class="text-secondary ml-2"  icon outlined rounded="sm" variant="flat"  v-bind="props">
          <DownloadIcon size="20" stroke-width="1.5" />
        </v-btn>
      </template>

      <v-list>
        <v-list-item @click="downloadSVG">
          <IconFileTypeSvg size="24" stroke-width="1.5" />
        </v-list-item>
        <v-list-item @click="downloadSVG">
          <IconFileTypePdf size="24" stroke-width="1.5" />
        </v-list-item>
      </v-list>
    </v-menu> -->
    <v-btn
      v-if="store.mode == 'project'"
      @click="saveDrawing"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :disabled="historyStore.saved"
      :variant="historyStore.saved ? 'plain' : 'flat'"
    >
      <DeviceFloppyIcon size="20" stroke-width="1.5" />
    </v-btn>

    <v-btn
      v-if="store.mode == 'block'"
      @click="saveDrawingAsBlock"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :disabled="historyStore.saved"
      :variant="historyStore.saved ? 'plain' : 'flat'"
    >
      <DeviceFloppyIcon size="20" stroke-width="1.5" />
      <v-tooltip activator="parent" location="bottom">Save As Block</v-tooltip>
    </v-btn>

    <v-btn @click="undo" class="text-secondary ml-2" icon outlined rounded="sm" variant="flat">
      <ArrowBackUpIcon size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="redo" class="text-secondary ml-2" icon outlined rounded="sm" variant="flat">
      <ArrowForwardUpIcon size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="fitSVGToExtent" class="text-secondary ml-2" icon outlined rounded="sm" variant="flat">
      <Focus2Icon size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="toggleGrid" class="text-secondary ml-2" icon outlined rounded="sm" variant="flat">
      <GridPatternIcon size="20" stroke-width="1.5" />
    </v-btn>
    <v-spacer />

    <v-speed-dial location="bottom center">
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          class="text-secondary ml-2"
          icon
          outlined
          rounded="sm"
          :variant="isActive('connectionPoints') ? 'tonal' : 'flat'"
        >
          <IconPointFilled size="20" stroke-width="1.5" />
        </v-btn>
      </template>

      <v-btn
        key="1"
        @click="startConnectionPointsTool('conductor')"
        class="text-secondary"
        icon
        outlined
        rounded="sm"
        :variant="isActive('connectionPoints') ? 'tonal' : 'flat'"
      >
        <IconPointFilled :color="store.connectionPointColors['conductor']" size="20" stroke-width="1.5" />
      </v-btn>
      <v-btn
        key="2"
        @click="startConnectionPointsTool('ground')"
        class="text-secondary"
        icon
        outlined
        rounded="sm"
        :variant="isActive('connectionPoints') ? 'tonal' : 'flat'"
      >
        <IconPointFilled :color="store.connectionPointColors['ground']" size="20" stroke-width="1.5"
      /></v-btn>
    </v-speed-dial>
    <v-btn @click="startTextTool" class="text-secondary ml-2" icon outlined rounded="sm" :variant="isActive('text') ? 'tonal' : 'flat'">
      <IconLetterCase size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setRectangleTool"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :variant="isActive('rectangle') ? 'tonal' : 'flat'"
    >
      <IconSquarePlus2 size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn
      v-if="store.mode == 'project' && store.activeSpace == 'model'"
      @click="setLine('run')"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :variant="store.isDrawing && store.currentLineId == 'run' ? 'tonal' : 'flat'"
    >
      <IconRoute2 style="color: black" size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setLine('solid-conductor')"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :variant="store.isDrawing && store.currentLineId == 'solid-conductor' ? 'tonal' : 'flat'"
    >
      <LineIcon style="color: black" size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setLine('solid-ground')"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :variant="store.isDrawing && store.currentLineId == 'solid-ground' ? 'tonal' : 'flat'"
    >
      <CircuitGroundIcon style="color: green" size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setLine('dashed-communication')"
      class="text-secondary ml-2"
      icon
      outlined
      rounded="sm"
      :variant="store.isDrawing && store.currentLineId == 'dashed-communication' ? 'tonal' : 'flat'"
    >
      <LineDashedIcon style="color: black" size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="$emit('openBlockDialog')" class="text-secondary ml-6" icon outlined rounded="sm" variant="flat">
      <CubePlusIcon size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="$emit('openImportSvgDialog')" class="text-secondary ml-2" icon outlined rounded="sm" variant="flat">
      <IconFileArrowLeft size="20" stroke-width="1.5" />
    </v-btn>
    <!-- 
    <v-btn @click="addNewBlock" class="text-secondary ml-2"  icon outlined rounded="sm" variant="flat" >
      <CubePlusIcon size="20" stroke-width="1.5" />
    </v-btn>
    -->
  </v-toolbar>
</template>
