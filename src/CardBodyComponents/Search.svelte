<script>
    import Card from "../Card.svelte";
    import { createEventDispatcher } from "svelte";
    const dispatcher = createEventDispatcher();

    let newWord = ""
    let cardType = "search";

    const enterKey = (e) => {
        if (e.keyCode == 13){
            dispatcher("getWord", newWord);
        }
    }
</script>

<Card {cardType}>
    <input type="text" bind:value = {newWord} on:keyup|preventDefault = {enterKey}>
    <button on:click = {() => dispatcher("getWord", newWord)} tabindex=0>Submit</button>
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
        transition: all 0.1s ease-in-out;
    }

    button:hover {
        border: 1px dashed #C81D41;
        background-color: #F8F1E7;
        color: #C81D41;
    }

    button:active {
        background-color: #17B169;
        color: #F8F1E7;
        border: none;
    }
</style>
