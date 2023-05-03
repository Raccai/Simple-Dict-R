<script>
    import Card from "../Card.svelte";
    import { createEventDispatcher } from "svelte";
    const dispatcher = createEventDispatcher();

    let newWord = ""
    let cardType = "search";
</script>

<Card {cardType}>
    <input type="text" bind:value = {newWord}>
    <button on:click = {() => dispatcher("getWord", newWord)}>Submit</button>
</Card>

<style>
    input {
        border: none;
        border-radius: 10px;
        margin: 4px auto;
    }

    button {
        border: none;
        background-color: #C81D41;
        color: #F8F1E7;
        border-radius: 10px;
        cursor: pointer;
    }
</style>
