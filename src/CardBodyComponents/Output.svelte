<script>
    import Card from "../Card.svelte";

    let cardType = "output";
</script>

<Card {cardType}>
    <div class="word">
        <slot name="word"></slot>
    </div>
    <div class="detail">
        <slot name="phonetic"></slot>
        <p>|</p>
        <slot name="pos"></slot>
    </div>
    <div class="meaning">
        <p class="meaning-example-header">Meaning</p>
        <slot name="meaning"></slot>
    </div>
    <div class="example">
        <p class="meaning-example-header">Example</p>
        <slot name="example"></slot>
    </div>
</Card>

<style>
    .word {
        font-weight: bold;
        font-size: 40px;
        margin: -40px auto -45px auto;
    }

    .detail {
        display: flex;
        margin-left: 60px;
        width: 180px;
        color: #999999;
        justify-content: space-around;
    }

    .meaning-example-header {
        margin: 0 0 -8px 0;
        font-weight: bold;
        color: #C81D41;
        font-size: 20px;
    }

    .example,
    .meaning {
        text-align: left;
    }
</style>