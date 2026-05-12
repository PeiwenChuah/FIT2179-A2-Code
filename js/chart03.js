async function renderChart03() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        const csvText = await response.text();
        
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        const dataRows = rows.slice(1); 

        const filteredData = dataRows.map(row => {
            const cols = row.split(',');
            return {
                date: cols[0].trim(),
                state: cols[1].trim(),
                district: cols[2].trim(),
                type: cols[3].trim(),
                beds: parseInt(cols[4])
            };
        }).filter(d => 
            d.date === "2022-01-01" && 
            d.state !== "Malaysia" && 
            d.district !== "All Districts" && 
            d.type !== "all" &&
            !isNaN(d.beds) && d.beds > 0
        );

        const stateLogos = {
            "Johor": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Coat_of_arms_of_Johor.svg/100px-Coat_of_arms_of_Johor.svg.png",
            "Selangor": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Coat_of_arms_of_Selangor.svg/100px-Coat_of_arms_of_Selangor.svg.png",
            "Kedah": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Coat_of_arms_of_Kedah.svg/100px-Coat_of_arms_of_Kedah.svg.png",
            "Kelantan": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Coat_of_arms_of_Kelantan.svg/100px-Coat_of_arms_of_Kelantan.svg.png",
            "Melaka": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Coat_of_arms_of_Malacca.svg/100px-Coat_of_arms_of_Malacca.svg.png",
            "Negeri Sembilan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Coat_of_arms_of_Negeri_Sembilan.svg/100px-Coat_of_arms_of_Negeri_Sembilan.svg.png",
            "Pahang": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Coat_of_arms_of_Pahang.svg/100px-Coat_of_arms_of_Pahang.svg.png",
            "Perak": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Coat_of_arms_of_Perak.svg/100px-Coat_of_arms_of_Perak.svg.png",
            "Perlis": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Coat_of_arms_of_Perlis.svg/100px-Coat_of_arms_of_Perlis.svg.png",
            "Pulau Pinang": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Coat_of_arms_of_Penang.svg/100px-Coat_of_arms_of_Penang.svg.png",
            "Sabah": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Sabah.svg/100px-Coat_of_arms_of_Sabah.svg.png",
            "Sarawak": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Coat_of_arms_of_Sarawak.svg/100px-Coat_of_arms_of_Sarawak.svg.png",
            "Terengganu": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coat_of_arms_of_Terengganu.svg/100px-Coat_of_arms_of_Terengganu.svg.png",
            "W.P. Kuala Lumpur": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Coat_of_arms_of_Kuala_Lumpur.svg/100px-Coat_of_arms_of_Kuala_Lumpur.svg.png",
            "W.P. Labuan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Coat_of_arms_of_Labuan.svg/100px-Coat_of_arms_of_Labuan.svg.png",
            "W.P. Putrajaya": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Coat_of_arms_of_Putrajaya.svg/100px-Coat_of_arms_of_Putrajaya.svg.png"
        };

        let chartData = [];
        let states = [...new Set(filteredData.map(d => d.state))];

        // Level 1: States (The big grouping containers)
        states.forEach(state => {
            chartData.push({
                id: state,
                name: state,
                color: Highcharts.getOptions().colors[states.indexOf(state) % 10]
            });
        });

        // Level 2: Districts (Nested inside States)
        let districtKeys = [...new Set(filteredData.map(d => `${d.state}-${d.district}`))];
        districtKeys.forEach(key => {
            const [state, district] = key.split('-');
            chartData.push({
                id: key,
                name: district,
                parent: state
            });
        });

        // Level 3: Hospital Types (Leaf nodes with the actual values)
        filteredData.forEach(d => {
            chartData.push({
                name: d.type.replace(/_/g, ' ').toUpperCase(),
                parent: `${d.state}-${d.district}`,
                value: d.beds
            });
        });

        Highcharts.chart('chart03', {
            chart: {
                height: 700
            },
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                allowDrillToNode: true,
                animationLimit: 1000,
                // These settings create the header-style look from image_e2ca07.jpg
                levels: [{
                    level: 1,
                    layoutAlgorithm: 'squarified',
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        align: 'left',
                        verticalAlign: 'top',
                        style: { 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            textOutline: 'none'
                        },
                        formatter: function() {
                            return `
                                <div style="display: flex; align-items: center; background: rgba(0,0,0,0.2); padding: 2px 5px; border-radius: 3px;">
                                    <img src="${stateLogos[this.point.name]}" style="width:18px; height:auto; margin-right:5px;">
                                    <span style="color:white; text-transform: uppercase;">${this.point.name}</span>
                                </div>`;
                        }
                    },
                    borderWidth: 4,
                    borderColor: '#222'
                }, {
                    level: 2,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.3)',
                    dataLabels: {
                        enabled: true,
                        style: { fontSize: '10px', color: '#fff', textOutline: '1px solid #000' },
                        align: 'center',
                        verticalAlign: 'middle'
                    }
                }],
                data: chartData
            }],
            title: {
                text: 'MALAYSIA HOSPITAL BED DISTRIBUTION',
                style: { fontFamily: 'Arial', fontWeight: 'bold' }
            },
            tooltip: {
                pointFormat: "<b>{point.name}</b>: {point.value} Beds"
            },
            credits: { enabled: false }
        });
    } catch (e) { console.error("Chart 03 Error:", e); }
}
renderChart03();