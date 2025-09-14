import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test content in different languages
const testContent = {
    english: `
    Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. It involves algorithms that can identify patterns in data and make predictions or classifications based on those patterns.
    `,
    
    spanish: `
    El Aprendizaje Automático es un subconjunto de la inteligencia artificial que permite a las computadoras aprender y tomar decisiones a partir de datos sin ser programadas explícitamente. Involucra algoritmos que pueden identificar patrones en los datos y hacer predicciones o clasificaciones basadas en esos patrones.
    `,
    
    french: `
    L'apprentissage automatique est un sous-ensemble de l'intelligence artificielle qui permet aux ordinateurs d'apprendre et de prendre des décisions à partir de données sans être explicitement programmés. Il implique des algorithmes qui peuvent identifier des modèles dans les données et faire des prédictions ou des classifications basées sur ces modèles.
    `,
    
    german: `
    Maschinelles Lernen ist ein Teilbereich der künstlichen Intelligenz, der es Computern ermöglicht, aus Daten zu lernen und Entscheidungen zu treffen, ohne explizit programmiert zu werden. Es umfasst Algorithmen, die Muster in Daten identifizieren und Vorhersagen oder Klassifikationen basierend auf diesen Mustern treffen können.
    `,
    
    hindi: `
    मशीन लर्निंग आर्टिफिशियल इंटेलिजेंस का एक हिस्सा है जो कंप्यूटर को डेटा से सीखने और निर्णय लेने की अनुमति देता है बिना स्पष्ट रूप से प्रोग्राम किए गए। इसमें एल्गोरिदम शामिल हैं जो डेटा में पैटर्न की पहचान कर सकते हैं और उन पैटर्न के आधार पर भविष्यवाणी या वर्गीकरण कर सकते हैं।
    `,
    
    arabic: `
    التعلم الآلي هو مجموعة فرعية من الذكاء الاصطناعي التي تمكن أجهزة الكمبيوتر من التعلم واتخاذ القرارات من البيانات دون أن تكون مبرمجة صراحة. وهو ينطوي على خوارزميات يمكنها تحديد الأنماط في البيانات وإجراء تنبؤات أو تصنيفات بناء على تلك الأنماط।
    `
};

async function generateFlashcardsMultiLanguage(content, language) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate 3 flashcards from the following content in ${language} language. 
    Respond in the SAME language as the content provided.
    
    Content: ${content}
    
    Format as JSON:
    {
        "flashcards": [
            {
                "question": "Question in ${language}",
                "answer": "Answer in ${language}"
            }
        ]
    }
    
    Make sure all questions and answers are in ${language} language only.`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Clean the response to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const flashcards = JSON.parse(jsonMatch[0]);
            return flashcards;
        }
        
        return { error: 'Could not parse JSON response', rawResponse: response };
    } catch (error) {
        return { error: error.message };
    }
}

async function runMultiLanguageTest() {
    console.log('🌍 Starting Multi-Language AI Test for Flashcard Generation\n');
    console.log('=' .repeat(60));
    
    for (const [language, content] of Object.entries(testContent)) {
        console.log(`\n📚 Testing ${language.toUpperCase()} language:`);
        console.log('-'.repeat(40));
        
        const result = await generateFlashcardsMultiLanguage(content, language);
        
        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            if (result.rawResponse) {
                console.log(`Raw response: ${result.rawResponse.substring(0, 200)}...`);
            }
        } else {
            console.log(`✅ Success! Generated ${result.flashcards?.length || 0} flashcards`);
            
            if (result.flashcards && result.flashcards.length > 0) {
                result.flashcards.forEach((card, index) => {
                    console.log(`\n  📝 Card ${index + 1}:`);
                    console.log(`  ❓ Q: ${card.question}`);
                    console.log(`  💡 A: ${card.answer.substring(0, 100)}${card.answer.length > 100 ? '...' : ''}`);
                });
            } else {
                console.log('  ⚠️  No flashcards in response');
            }
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 Multi-Language Test Complete!');
}

// Language detection test
async function detectLanguageAccuracy(content, expectedLanguage) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Detect the language of this text and respond with just the language name: ${content}`;
    
    try {
        const result = await model.generateContent(prompt);
        const detectedLanguage = result.response.text().trim().toLowerCase();
        
        return {
            expected: expectedLanguage,
            detected: detectedLanguage,
            accurate: detectedLanguage.includes(expectedLanguage.toLowerCase())
        };
    } catch (error) {
        return { error: error.message };
    }
}

async function runLanguageDetectionTest() {
    console.log('\n🔍 Testing Language Detection Accuracy\n');
    console.log('=' .repeat(50));
    
    for (const [language, content] of Object.entries(testContent)) {
        const result = await detectLanguageAccuracy(content, language);
        
        if (result.error) {
            console.log(`❌ ${language}: Error - ${result.error}`);
        } else {
            const status = result.accurate ? '✅' : '❌';
            console.log(`${status} ${language}: Expected "${result.expected}", Got "${result.detected}"`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Run tests
async function runAllTests() {
    try {
        await runMultiLanguageTest();
        await runLanguageDetectionTest();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Export for use in other files
export { generateFlashcardsMultiLanguage, detectLanguageAccuracy, testContent };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().then(() => {
        console.log('\n🎉 Test execution completed!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}