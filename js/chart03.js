async function renderChart03() {
    try {
        const response = await fetch('data/hospital_beds_treemap.csv');
        if (!response.ok) throw new Error('CSV not found');
        const csvText = await response.text();
        
        const rows = csvText.split(/\r?\n/).filter(row => row.trim().length > 0);
        const dataRows = rows.slice(1); 

        const filteredData = dataRows.map(row => {
            const cols = row.split(',');
            if (cols.length < 5) return null;
            return {
                date: cols[0].trim(),
                state: cols[1].trim(),
                district: cols[2].trim(),
                type: cols[3].trim(),
                beds: parseInt(cols[4])
            };
        }).filter(d => 
            d !== null && d.date === "2022-01-01" && 
            d.state !== "Malaysia" && d.district !== "All Districts" && 
            d.type !== "all" && !isNaN(d.beds) && d.beds > 0
        );

        // 16 Unique Colors - Ensuring maximum distinctness
        const uniqueStateColors = [
            '#2E5A88', '#A85A24', '#4D5A5A', '#1F7A6F', '#6C3483', 
            '#21618C', '#922B21', '#512E5F', '#0E6251', '#7E5109',
            '#283747', '#7D6608', '#1B4F72', '#4A235A', '#145A32', '#78281F'
        ];

        let chartData = [];
        let states = [...new Set(filteredData.map(d => d.state))];

        states.forEach(state => {
            chartData.push({ id: state, name: state, color: 'transparent' });
        });

        let districtKeys = [...new Set(filteredData.map(d => `${d.state}|${d.district}`))];
        districtKeys.forEach(key => {
            const [state, district] = key.split('|');
            chartData.push({ id: key, name: district, parent: state });
        });

        filteredData.forEach(d => {
            chartData.push({
                name: d.type.replace(/hospital_/g, '').replace(/_/g, ' ').toUpperCase(),
                parent: `${d.state}|${d.district}`,
                value: d.beds,
                color: uniqueStateColors[states.indexOf(d.state) % uniqueStateColors.length]
            });
        });

        Highcharts.chart('chart03', {
            chart: {
                height: 850,
                width: null, // Fills container width
                backgroundColor: 'transparent',
                style: { fontFamily: 'Arial, sans-serif' }
            },
            title: {
                text: 'MALAYSIA HOSPITAL BED DISTRIBUTION BY STATE (2022)',
                style: { color: '#000', fontWeight: 'bold', fontSize: '20px' }
            },
            plotOptions: {
                treemap: {
                    layoutAlgorithm: 'squarified',
                    levels: [{
                        level: 1, // STATE HEADER (Top Black Bar)
                        borderWidth: 4,
                        borderColor: '#000',
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            align: 'left',
                            verticalAlign: 'top',
                            style: { zIndex: 10 },
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            padding: 4,
                            formatter: function() {
                                return `<span style="color:#FFF; font-size:11px; font-weight:bold;">${this.point.name.toUpperCase()} ></span>`;
                            }
                        }
                    }, {
                        level: 2, // DISTRICT - Fixed visibility
                        borderWidth: 2,
                        borderColor: '#000',
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            align: 'center',
                            verticalAlign: 'top',
                            y: 20, // Offset to stay below State Header
                            style: { 
                                color: '#FFD700', // Gold/Yellow
                                fontWeight: '900',
                                textOutline: '2px solid #000',
                                textAlign: 'center',
                                width: '100%'
                            },
                            formatter: function() {
                                // Dynamic resizing based on box width
                                let fontSize = '14px';
                                if (this.point.shapeArgs.width < 80) fontSize = '10px';
                                if (this.point.shapeArgs.width < 50) fontSize = '8px';
                                
                                return `<div style="font-size: ${fontSize}; word-wrap: break-word; width: ${this.point.shapeArgs.width - 10}px;">${this.point.name}</div>`;
                            }
                        }
                    }, {
                        level: 3, // HOSPITAL TYPE
                        dataLabels: {
                            enabled: true,
                            style: { 
                                fontSize: '9px', 
                                color: 'rgba(255,255,255,0.8)', 
                                fontWeight: 'bold',
                                textOutline: '1px solid #000' 
                            },
                            formatter: function() {
                                // Only show type if box is large enough to avoid overlap
                                return (this.point.shapeArgs.width > 40 && this.point.shapeArgs.height > 20) ? this.point.name : null;
                            }
                        }
                    }]
                }
            },
            series: [{
                type: 'treemap',
                allowDrillToNode: true,
                interactByLeaf: false,
                data: chartData
            }],
            credits: { enabled: false }
        });
    } catch (e) {
        console.error(e);
    }
}

renderChart03();