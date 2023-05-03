<script>
	import Card from "./Card.svelte";
  	import Header from "./Header.svelte";
  	import Output from "./CardBodyComponents/Output.svelte";
	import Search from "./CardBodyComponents/Search.svelte";

	let cardType = "main";
	let wordInfo = {
		word: "Your Word",
		phonetic: "Phonetic",
		pos: "Part of Speech",
		meaning: "Here you will see the meaning of the word.",
		example: "Here, if present, you will see an example usage of the word.",
	};

	const dictAPI = "https://api.dictionaryapi.dev/api/v2/entries/en/"

	const getWord = (e) => {
		fetch(`${dictAPI}${e.detail}`)
			.then((response) => response.json())
			.then((data) => {
				wordInfo.word = e.detail;
				wordInfo.phonetic = data[0].phonetics[0].text || "";
				wordInfo.pos = data[0].meanings[0].partOfSpeech || "";
				wordInfo.meaning = data[0].meanings[0].definitions[0].definition || "";
				wordInfo.example = data[0].meanings[0].definitions[0].example || "";
			}
		)
	}
</script>

<main>
	<Header />
	<Card {cardType}>
		<Search on:getWord = {getWord}/>
		<Output>
			<p slot="word">{wordInfo.word}</p>
			<p slot="phonetic">{wordInfo.phonetic}</p>
			<p slot="pos">{wordInfo.pos}</p>
			<p slot="meaning">{wordInfo.meaning}</p>
			<p slot="example">{wordInfo.example}</p>
		</Output>
	</Card>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>