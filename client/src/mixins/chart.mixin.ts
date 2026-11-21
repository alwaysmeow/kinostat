import { Vue } from "vue-class-component";

export default class ChartMixin extends Vue {
    getChartObject(refName: string) {
        const chartkick = (this.$refs[refName] as any)?.chart;
        return chartkick?.getChartObject?.();
    }

    getClickedChartElements(
        refName: string,
        event: MouseEvent,
        axis?: "x" | "y" | "xy"
    ) {
        const chart = this.getChartObject(refName);
        if (!chart || event.target !== chart.canvas) return [];
        const options: { intersect: boolean; axis?: "x" | "y" | "xy" } = {
            intersect: false,
        };
        if (axis) options.axis = axis;
        return chart.getElementsAtEventForMode(
            event,
            "nearest",
            options,
            false
        );
    }

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
        elements: {
            line: {
                borderWidth: 3,
            },
            point: {
                radius: 3,
                hoverRadius: 6,
                borderWidth: 0,
            },
        },
        scales: {
          x: {
            type: 'linear',
            offset: false,
            bounds: 'data',
            afterBuildTicks: (axis: any) => {
                const ticks = axis.ticks;
                if (ticks.length < 3) return;

                const lastGap =
                    ticks[ticks.length - 1].value -
                    ticks[ticks.length - 2].value;
                const regularGap =
                    ticks[ticks.length - 2].value -
                    ticks[ticks.length - 3].value;

                if (lastGap < regularGap / 2) {
                    ticks.splice(ticks.length - 2, 1);
                }
            },
            ticks: {
                color: "#888888",
                maxRotation: 0,
            },
          },
          y: {
            grid: {
                color: "rgba(255, 255, 255, 0.07)",
            },
            ticks: {
                color: "#888888",
            },
          }
        },
        plugins: {
          datalabels: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#242424",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
          }
        },
    };
}
