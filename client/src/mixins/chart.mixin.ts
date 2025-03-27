import { Vue } from "vue-class-component";

export default class ChartMixin extends Vue {
    pieChartOptions = {
        cutout: "50%",
        radius: "70%",
        elements: {
            arc: {
                borderWidth: 0,
            },
        },
        plugins: {
            datalabels: {
                font: {
                    size: 14,
                    weight: "bold",
                },
                formatter: (value: number, context: any) => {
                    return `${
                        context.chart.data.labels[context.dataIndex]
                    } (${value})`;
                },
                anchor: "end",
                align: "end",
                offset: 20,
                clip: false,
            },
        },
    };

    barChartOptions = {
        borderRadius: 5,
        scales: {
            x: {
                ticks: {
                    color: "#fff",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                },
                grid: {
                    color: "#333333",
                },
                min: 0,
                max: 10,
            },
            y: {
                ticks: {
                    color: "#fff",
                    font: {
                        size: 14,
                    },
                },
            },
        },
        plugins: {
            datalabels: {
                formatter: (value: number) => {
                    return value;
                },
                color: "#fff",
                anchor: "end",
                align: "end",
                offset: 5,
                clip: false,
            },
            tooltip: {
                enabled: false,
            },
        },
    };

    lineChartOptions = {
        scales: {
          x: {
            type: 'linear',
            offset: false,
            bounds: 'data',
          }
        },
        plugins: {
          datalabels: {
            display: false,
          }
        },
    };
}
