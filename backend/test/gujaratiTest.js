import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGujaratiFlashcards() {
    console.log('🇮🇳 Testing Gujarati Flashcard Generation...\n');
    
    const gujaratiStory = `
    બાપા કાગડો... હા બેટા કાગડો  
  
એક ગામમાં એક વેપારીની કરિયાણાની નાની દુકાન હતી. આ વેપારી આખો દિવસ દુકાનમાં બેસી ચીજ વસ્તુ વેંચે. વેપારનો હિસાબ એક ચોપડામાં લખે.

આ વેપારીનો દીકરો નાનો હતો ત્યારે દુકાને આવીને રમે. દુકાનની સામે ઝાડ પર કાગડો બેસીને કા..કા કર્યા કરતો. નાનો બાળક એના બાપને કહ્યા કરે:

"બાપા જુઓ આ કાગડો.."

વેપારી ચોપડામાં માથું નાખી કામ કરતા જાય અને દીકરાને જવાબ આપતા જાય:

"હા બેટા કાગડો..".

આવું વારંવાર થાય એમાં વેપારી ભૂલથી ચોપડામાં લખી નાખે:

"બાપા જુઓ આ કાગડો..હા બેટા કાગડો"

વર્ષો પછી વેપારી ઘરડો થઇ ગયો અને એનો દીકરો યુવાન થઇ ગયો એટલે દીકરાએ દુકાન સંભાળી લીધી. ઘરડો બાપ કોઈ કોઈ વાર દુકાને આવીને બેસે અને દીકરા સાથે વાત કરવા લાગે. દીકરાને કામમાં ખલેલ પડે એટલે એ બાપને ધમકાવે અને મુંગા બેસી રહેવા કહે. ઘણી વાર તો બાપનું અપમાન પણ કરી લે. એક વાર ઘરડા વેપારીએ દુઃખી થઈને દીકરાને કાંઇક સમજાવવા વિચાર્યું. એણે વર્ષો જુના હિસાબના ચોપડાઓ દીકરા પાસે મૂકી દીધા.

દીકરાએ આ ચોપડાઓ જોયા તો એમાં વાંચ્યું:

"બાપા જુઓ આ કાગડો..હા બેટા કાગડો".

દીકરાને એના બાળપણની વાત યાદ આવી ગઈ કે પોતે સતત રમત કર્યા કરતો અને આવું બોલ્યા કરતો ત્યારે એના બાપ જરાયે અકળાયા વગર એને જવાબ આપ્યા કરતા એમાં જ એમનાથી ભૂલમાં આવું લખાઈ ગયું હતું. દીકરાને ખુબ જ પસ્તાવો થયો કે એના બાપે જરાયે અકળાયા વગર એને આવા લાડ લડાવ્યા હતા જયારે પોતે તો ઘરડા થઇ ગયેલા બાપનું અપમાન કરે છે અને એમને વાત જ નથી કરવા દેતો. ત્યાર પછી દીકરો બાપનું ક્યારેય અપમાન ન કરતો અને એમની સાથે વાતો કરીને એમને આનંદમાં રાખતો.

=> ઘરડા મા-બાપનું ક્યારેય અપમાન ન કરવું. એમણે આપણે નાના હતા ત્યારે આપણી બધી જ ધમાલ-મસ્તી સહન કરીને આપણને ખુશ રાખ્યા હતા તો જયારે આપણે મોટા થઇ જઈએ અને મા-બાપ ઘરડા થઇ જાય ત્યારે એમની સાથે પ્રેમથી વાતો કરીને એમને આનંદમાં રાખવા જોઈએ.
    `;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `આ ગુજરાતી વાર્તામાંથી 3 ફ્લેશકાર્ડ બનાવો. 
    ફક્ત ગુજરાતી ભાષામાં જ જવાબ આપો.
    
    વાર્તા: ${gujaratiStory}
    
    JSON ફોર્મેટમાં આપો:
    {
        "flashcards": [
            {
                "question": "ગુજરાતીમાં પ્રશ્ન",
                "answer": "ગુજરાતીમાં જવાબ"
            }
        ]
    }
    
    વાર્તાના મુખ્ય મુદ્દાઓ, પાત્રો અને નૈતિક શિક્ષા પર ફ્લેશકાર્ડ બનાવો.`;
    
    try {
        console.log('🔄 Generating Gujarati flashcards...\n');
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('📝 Raw AI Response:');
        console.log(response);
        console.log('\n' + '='.repeat(60));
        
        // Try to parse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const flashcards = JSON.parse(jsonMatch[0]);
            console.log('\n📚 Generated Gujarati Flashcards:');
            console.log('='.repeat(40));
            
            flashcards.flashcards.forEach((card, index) => {
                console.log(`\n${index + 1}. 🤔 પ્રશ્ન: ${card.question}`);
                console.log(`   💡 જવાબ: ${card.answer}`);
                console.log('-'.repeat(50));
            });
            
            console.log('\n✅ Gujarati flashcard generation successful!');
            console.log(`📊 Generated ${flashcards.flashcards.length} flashcards in Gujarati`);
            
        } else {
            console.log('⚠️ Could not parse JSON from response');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run test
console.log('🌍 Gujarati Language AI Test');
console.log('='.repeat(60));

testGujaratiFlashcards()
    .then(() => {
        console.log('\n🎉 Gujarati test completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });