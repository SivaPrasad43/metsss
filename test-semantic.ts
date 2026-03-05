import { database } from './src/config/database';
import { TagModel } from './src/models/Tag';
import { cosineSimilarity } from './src/utils/similarity';

async function testSemanticSearch() {
  try {
    await database.connect();
    
    const tagModel = new TagModel();
    const allTags = await tagModel.findAll();
    
    console.log(`\n=== Semantic Search Test ===`);
    console.log(`Total tags: ${allTags.length}`);
    
    const tagsWithEmbeddings = allTags.filter(tag => tag.embedding && tag.embedding.length > 0);
    console.log(`Tags with embeddings: ${tagsWithEmbeddings.length}`);
    
    if (tagsWithEmbeddings.length === 0) {
      console.log('\nNo embeddings found! Start the server first to generate embeddings.');
      await database.disconnect();
      return;
    }
    
    const riceTag = allTags.find(tag => tag.name === 'rice');
    if (!riceTag || !riceTag.embedding) {
      console.log('\nRice tag not found or has no embedding!');
      await database.disconnect();
      return;
    }
    
    console.log(`\nRice tag found with embedding (dimension: ${riceTag.embedding.length})`);
    
    // Calculate similarities
    const similarities: Array<{ name: string; similarity: number }> = [];
    
    for (const tag of allTags) {
      if (tag.name === 'rice' || !tag.embedding) continue;
      
      const similarity = cosineSimilarity(riceTag.embedding, tag.embedding);
      similarities.push({ name: tag.name, similarity });
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    console.log('\n--- Top 10 Most Similar Tags to "rice" ---');
    similarities.slice(0, 10).forEach((item, index) => {
      const marker = item.similarity >= 0.65 ? '✅' : '  ';
      console.log(`${marker} ${index + 1}. ${item.name.padEnd(20)} ${item.similarity.toFixed(4)}`);
    });
    
    const biriyaniSim = similarities.find(s => s.name === 'biriyani');
    const arabicSim = similarities.find(s => s.name === 'arabic');
    
    console.log('\n--- Key Relationships ---');
    console.log(`rice ↔ biriyani: ${biriyaniSim?.similarity.toFixed(4) || 'N/A'} ${biriyaniSim && biriyaniSim.similarity >= 0.65 ? '✅' : '❌'}`);
    console.log(`rice ↔ arabic:   ${arabicSim?.similarity.toFixed(4) || 'N/A'} ${arabicSim && arabicSim.similarity >= 0.65 ? '✅' : '❌'}`);
    
    await database.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await database.disconnect();
  }
}

testSemanticSearch();
