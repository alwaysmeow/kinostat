import { Vue } from 'vue-class-component';
import useStatistic from "../store/statistic";

export default class StoreMixin extends Vue {

    get votes(): Object[] {
        const store = useStatistic();
        return store.votes;
    }

    get actors(): Object[] {
        const store = useStatistic();
        return store.actors;
    }

    get directors(): Object[] {
        const store = useStatistic();
        return store.directors;
    }

    setVotes(data: Object[]): void {
        const store = useStatistic();
        store.setVotes(data);
    }
}