import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testSpanishFlashcards() {
    console.log('🇪🇸 Testing Spanish Flashcard Generation...\n');
    
    const spanishContent = `
    El Aprendizaje Automático es un subconjunto de la inteligencia artificial que permite a las computadoras aprender y tomar decisiones a partir de datos sin ser programadas explícitamente. Involucra algoritmos que pueden identificar patrones en los datos y hacer predicciones o clasificaciones basadas en esos patrones.
    `;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate 2 flashcards from the following Spanish content. 
    Respond in SPANISH language only.
    
    Content: ${spanishContent}
    
    Format as JSON:
    {
        "flashcards": [
            {
                "question": "Pregunta en español",
                "answer": "Respuesta en español"
            }
        ]
    }`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('Raw AI Response:');
        console.log(response);
        console.log('\n' + '='.repeat(50));
        
        // Try to parse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const flashcards = JSON.parse(jsonMatch[0]);
            console.log('\n📚 Generated Spanish Flashcards:');
            flashcards.flashcards.forEach((card, index) => {
                console.log(`\n${index + 1}. 🤔 Pregunta: ${card.question}`);
                console.log(`   💡 Respuesta: ${card.answer}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testHindiFlashcards() {
    console.log('\n🇮🇳 Testing Hindi Flashcard Generation...\n');
    
    const hindiContent = `
    मशीन लर्निंग आर्टिफिशियल इंटेलिजेंस का एक हिस्सा है जो कंप्यूटर को डेटा से सीखने और निर्णय लेने की अनुमति देता है बिना स्पष्ट रूप से प्रोग्राम किए गए। इसमें एल्गोरिदम शामिल हैं जो डेटा में पैटर्न की पहचान कर सकते हैं।
    `;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate 2 flashcards from the following Hindi content. 
    Respond in HINDI language only.
    
    Content: ${hindiContent}
    
    Format as JSON:
    {
        "flashcards": [
            {
                "question": "हिंदी में प्रश्न",
                "answer": "हिंदी में उत्तर"
            }
        ]
    }`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('Raw AI Response:');
        console.log(response);
        console.log('\n' + '='.repeat(50));
        
        // Try to parse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const flashcards = JSON.parse(jsonMatch[0]);
            console.log('\n📚 Generated Hindi Flashcards:');
            flashcards.flashcards.forEach((card, index) => {
                console.log(`\n${index + 1}. 🤔 प्रश्न: ${card.question}`);
                console.log(`   💡 उत्तर: ${card.answer}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run tests
console.log('🌍 Multi-Language Flashcard Generation Test\n');
console.log('='.repeat(60));

testSpanishFlashcards()
    .then(() => testHindiFlashcards())
    .then(() => {
        console.log('\n✅ Multi-language test completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });