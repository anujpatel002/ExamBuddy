import { generateFlashcards, generateMarkBasedQuestions, generateQuiz, generateSummary } from '../services/aiService.js';
import dotenv from 'dotenv';
dotenv.config();

const hindiContent = `
मशीन लर्निंग आर्टिफिशियल इंटेलिजेंस का एक महत्वपूर्ण हिस्सा है। यह कंप्यूटर को डेटा से सीखने की क्षमता प्रदान करता है। मशीन लर्निंग के मुख्य प्रकार हैं: सुपरवाइज्ड लर्निंग, अनसुपरवाइज्ड लर्निंग, और रीइन्फोर्समेंट लर्निंग। इसका उपयोग इमेज रिकग्निशन, नेचुरल लैंग्वेज प्रोसेसिंग, और प्रेडिक्टिव एनालिटिक्स में किया जाता है।
`;

const gujaratiContent = `
મશીન લર્નિંગ આર્ટિફિશિયલ ઇન્ટેલિજન્સનો એક મહત્વપૂર્ણ ભાગ છે. આ કમ્પ્યુટરને ડેટામાંથી શીખવાની ક્ષમતા આપે છે. મશીન લર્નિંગના મુખ્ય પ્રકારો છે: સુપરવાઇઝ્ડ લર્નિંગ, અનસુપરવાઇઝ્ડ લર્નિંગ, અને રીઇન્ફોર્સમેન્ટ લર્નિંગ. તેનો ઉપયોગ ઇમેજ રિકગ્નિશન, નેચરલ લેંગ્વેજ પ્રોસેસિંગ, અને પ્રેડિક્ટિવ એનાલિટિક્સમાં થાય છે.
`;

async function testAllComponents() {
    console.log('🌍 Testing Integrated Hindi & Gujarati Support\n');
    console.log('='.repeat(60));
    
    // Test Hindi
    console.log('\n🇮🇳 HINDI TESTS:');
    console.log('-'.repeat(30));
    
    try {
        console.log('\n📚 1. Hindi Flashcards:');
        const hindiFlashcards = await generateFlashcards(hindiContent, 0, null, [], 2);
        if (hindiFlashcards && hindiFlashcards.length > 0) {
            hindiFlashcards.forEach((card, i) => {
                console.log(`${i+1}. Q: ${card.question}`);
                console.log(`   A: ${card.answer.substring(0, 100)}...`);
            });
        }
        
        console.log('\n📝 2. Hindi Practice Questions:');
        const hindiQuestions = await generateMarkBasedQuestions(hindiContent, '3', [], 2);
        if (hindiQuestions && hindiQuestions.length > 0) {
            hindiQuestions.forEach((q, i) => {
                console.log(`${i+1}. Q: ${q.question}`);
                console.log(`   A: ${q.answer.substring(0, 100)}...`);
            });
        }
        
        console.log('\n🎯 3. Hindi MCQ Quiz:');
        const hindiQuiz = await generateQuiz(hindiContent, 2);
        if (hindiQuiz && hindiQuiz.mcqs) {
            hindiQuiz.mcqs.forEach((q, i) => {
                console.log(`${i+1}. ${q.question}`);
                console.log(`   Options: ${q.options.join(', ')}`);
            });
        }
        
        console.log('\n📄 4. Hindi Summary:');
        const hindiSummary = await generateSummary(hindiContent);
        console.log(hindiSummary.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('❌ Hindi test error:', error.message);
    }
    
    // Test Gujarati
    console.log('\n\n🇮🇳 GUJARATI TESTS:');
    console.log('-'.repeat(30));
    
    try {
        console.log('\n📚 1. Gujarati Flashcards:');
        const gujaratiFlashcards = await generateFlashcards(gujaratiContent, 0, null, [], 2);
        if (gujaratiFlashcards && gujaratiFlashcards.length > 0) {
            gujaratiFlashcards.forEach((card, i) => {
                console.log(`${i+1}. Q: ${card.question}`);
                console.log(`   A: ${card.answer.substring(0, 100)}...`);
            });
        }
        
        console.log('\n📝 2. Gujarati Practice Questions:');
        const gujaratiQuestions = await generateMarkBasedQuestions(gujaratiContent, '3', [], 2);
        if (gujaratiQuestions && gujaratiQuestions.length > 0) {
            gujaratiQuestions.forEach((q, i) => {
                console.log(`${i+1}. Q: ${q.question}`);
                console.log(`   A: ${q.answer.substring(0, 100)}...`);
            });
        }
        
        console.log('\n🎯 3. Gujarati MCQ Quiz:');
        const gujaratiQuiz = await generateQuiz(gujaratiContent, 2);
        if (gujaratiQuiz && gujaratiQuiz.mcqs) {
            gujaratiQuiz.mcqs.forEach((q, i) => {
                console.log(`${i+1}. ${q.question}`);
                console.log(`   Options: ${q.options.join(', ')}`);
            });
        }
        
        console.log('\n📄 4. Gujarati Summary:');
        const gujaratiSummary = await generateSummary(gujaratiContent);
        console.log(gujaratiSummary.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('❌ Gujarati test error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Integrated Language Test Complete!');
}

testAllComponents()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });