<template>
    <h4>Статистика пользователя {{ userId }}</h4>
    <votes-list :votes="votes"/>
</template>

<script lang="ts">

interface Data {
    votes: Array<Record<string, any>>,
}

export default {
    props: {
        userId: { type: Number, required: true },
    },
    data(): Data {
        return {
            votes: [],
        }
    },
    created() {
        this.getVotes();
    },
    methods: {
        async getVotes() {
            const response = await fetch(`/api/votes?user_id=${this.userId}`);
            this.votes = await response.json();
            this.votes = this.votes.map(item => {
                const [title, year] = item.alt.split('(').map((str: String) => str.slice(0, -1))
                return {
                    title: title,
                    year: year,
                    ...item
                }
            })
        }
    }
};
</script>