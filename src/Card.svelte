<script>
    export let cardType = "output";
</script>

<div class="card" class:search = {cardType == "search"} class:header = {cardType == "header"} class:output = {cardType == "output"} class:main = {cardType == "main"}>
    <slot></slot>
</div>

<style>
    .card {
        text-align: center;
        max-width: 800px;
        width: 300px;
        margin: 200px 0 0 0;
        padding: 10px 40px 20px 40px;
        border-radius: 25px;
        background: #FBFBFB;
    }

    .main {
        box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.1);
    }

    .search {
        background: #F8F1E7;
        height: 70px;
        margin-top: -10px;
        margin-left: -40px;
    }

    .output {
        background: #FBFBFB;
        margin-top: -40px;
        margin-left: -40px;
    }
</style>