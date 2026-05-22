// chart02.js - Radar chart with HTML dropdown controls above
(function() {

const spec = "json/chart02.vg.json";

// Embed the chart and add HTML controls above it
const container = document.getElementById('chart02');

if (container) {
  // Create controls wrapper
  const controlsWrapper = document.createElement('div');
  controlsWrapper.style.cssText = `
    font-family: 'Source Sans 3', sans-serif;
    margin-bottom: 0.2rem;
  `;

  // Row 1: Dropdowns
  const dropdownRow = document.createElement('div');
  dropdownRow.style.cssText = `
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  `;

  const states = ["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu"];

  // State A dropdown
  const labelA = document.createElement('label');
  labelA.textContent = 'State 1: ';
  labelA.style.cssText = 'font-size: 0.82rem; font-weight: 700; color: #1a1f2e; letter-spacing: 0.03em;';

  const selectA = document.createElement('select');
  selectA.style.cssText = `
    font-family: 'Source Sans 3', sans-serif;
    font-size: 0.84rem;
    font-weight: 600;
    color: #1a1f2e;
    background: #fff;
    border: 1.5px solid #e2e6ea;
    border-radius: 6px;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    outline: none;
    margin-left: 0.3rem;
  `;
  states.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === 'Sarawak') opt.selected = true;
    selectA.appendChild(opt);
  });

  // State B dropdown
  const labelB = document.createElement('label');
  labelB.textContent = 'State 2: ';
  labelB.style.cssText = 'font-size: 0.82rem; font-weight: 700; color: #1a1f2e; letter-spacing: 0.03em;';

  const selectB = document.createElement('select');
  selectB.style.cssText = selectA.style.cssText;
  states.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === 'Selangor') opt.selected = true;
    selectB.appendChild(opt);
  });

  dropdownRow.appendChild(labelA);
  dropdownRow.appendChild(selectA);
  dropdownRow.appendChild(labelB);
  dropdownRow.appendChild(selectB);

  // Row 2: Legend with state names
  const legendRow = document.createElement('div');
  legendRow.style.cssText = `
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
  `;

  // Legend for State 1
  const legend1 = document.createElement('span');
  legend1.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #3d4a5c;
  `;
  const dot1 = document.createElement('span');
  dot1.style.cssText = `
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #c8972a;
  `;
  const stateName1 = document.createElement('span');
  stateName1.textContent = 'Sarawak';
  stateName1.id = 'legend-stateA-name';
  legend1.appendChild(dot1);
  legend1.appendChild(stateName1);

  // Legend for State 2
  const legend2 = document.createElement('span');
  legend2.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #3d4a5c;
  `;
  const dot2 = document.createElement('span');
  dot2.style.cssText = `
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #1a3a5c;
  `;
  const stateName2 = document.createElement('span');
  stateName2.textContent = 'Selangor';
  stateName2.id = 'legend-stateB-name';
  legend2.appendChild(dot2);
  legend2.appendChild(stateName2);

  legendRow.appendChild(legend1);
  legendRow.appendChild(legend2);

  controlsWrapper.appendChild(dropdownRow);
  controlsWrapper.appendChild(legendRow);

  // Create chart div
  const chartDiv = document.createElement('div');
  chartDiv.id = 'chart02-inner';
  chartDiv.style.width = '100%';

  // Insert controls above chart
  container.appendChild(controlsWrapper);
  container.appendChild(chartDiv);

  // Embed chart and set up interactivity
  vegaEmbed('#chart02-inner', spec, {actions: false}).then(result => {
    
    // Function to update chart and legend when dropdowns change
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
    
    // Initial run
    updateChart();
  }).catch(error => {
    console.error('Error embedding chart02:', error);
  });
}

})();