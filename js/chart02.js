// chart02.js - Radar chart with dropdown controls
(function() {

const spec = "json/chart02.vg.json";

const container = document.getElementById('chart02');

if (container) {

  // Use browser default font everywhere
  container.style.fontFamily = "inherit";

  // Controls wrapper
  const controlsWrapper = document.createElement('div');
  controlsWrapper.style.cssText = `
    margin-bottom: 0.1rem;
  `;

  // Row 1: Dropdowns
  const dropdownRow = document.createElement('div');
  dropdownRow.style.cssText = `
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  `;

  const states = [
    "Johor",
    "Kedah",
    "Kelantan",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Perak",
    "Perlis",
    "Pulau Pinang",
    "Sabah",
    "Sarawak",
    "Selangor",
    "Terengganu"
  ];

  // State 1 label
  const labelA = document.createElement('label');
  labelA.textContent = 'State 1: ';
  labelA.style.cssText = `
    font-size: 1rem;
    font-weight: normal;
    color: black;
  `;

  // State 1 dropdown
  const selectA = document.createElement('select');
  selectA.style.cssText = `
    font-size: 0.9rem;
    padding: 0.25rem 0.6rem;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    margin-left: 1.5rem;
    background: white;
    cursor: pointer;
  `;

  states.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;

    if (s === 'Sarawak') {
      opt.selected = true;
    }

    selectA.appendChild(opt);
  });

  // State 2 label
  const labelB = document.createElement('label');
  labelB.textContent = 'State 2: ';
  labelB.style.cssText = `
    font-size: 1rem;
    font-weight: normal;
    color: black;
  `;

  // State 2 dropdown
  const selectB = document.createElement('select');
  selectB.style.cssText = selectA.style.cssText;

  states.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;

    if (s === 'Selangor') {
      opt.selected = true;
    }

    selectB.appendChild(opt);
  });

  dropdownRow.appendChild(labelA);
  dropdownRow.appendChild(selectA);
  dropdownRow.appendChild(labelB);
  dropdownRow.appendChild(selectB);

  // Row 2: Legend
  const legendRow = document.createElement('div');
  legendRow.style.cssText = `
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: -0.4rem;
  `;

  // Legend 1
  const legend1 = document.createElement('span');
  legend1.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: black;
  `;

  const dot1 = document.createElement('span');
  dot1.style.cssText = `
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #c8972a;
    display: inline-block;
  `;

  const stateName1 = document.createElement('span');
  stateName1.textContent = 'Sarawak';
  stateName1.id = 'legend-stateA-name';

  legend1.appendChild(dot1);
  legend1.appendChild(stateName1);

  // Legend 2
  const legend2 = document.createElement('span');
  legend2.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: black;
  `;

  const dot2 = document.createElement('span');
  dot2.style.cssText = `
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #1a3a5c;
    display: inline-block;
  `;

  const stateName2 = document.createElement('span');
  stateName2.textContent = 'Selangor';
  stateName2.id = 'legend-stateB-name';

  legend2.appendChild(dot2);
  legend2.appendChild(stateName2);

  legendRow.appendChild(legend1);
  legendRow.appendChild(legend2);

  // Add rows
  controlsWrapper.appendChild(dropdownRow);
  controlsWrapper.appendChild(legendRow);

  // Chart div
  const chartDiv = document.createElement('div');
  chartDiv.id = 'chart02-inner';
  chartDiv.style.width = '100%';
  chartDiv.style.marginLeft = '1.5rem'; // Moves the chart to the right

  // Add to page
  container.appendChild(controlsWrapper);
  container.appendChild(chartDiv);

  // Vega embed
  vegaEmbed('#chart02-inner', spec, {actions: false})
    .then(result => {

      function updateChart() {
        const stateAVal = selectA.value;
        const stateBVal = selectB.value;

        result.view.signal('stateA', stateAVal);
        result.view.signal('stateB', stateBVal);
        result.view.runAsync();

        // Update legend text
        document.getElementById('legend-stateA-name').textContent = stateAVal;
        document.getElementById('legend-stateB-name').textContent = stateBVal;
      }

      selectA.addEventListener('change', updateChart);
      selectB.addEventListener('change', updateChart);

      updateChart();
    })
    .catch(error => {
      console.error('Error embedding chart02:', error);
    });
}

})();