import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import nellorApp from "@/assets/nellor-app.png";

const Download = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold mb-8 text-primary [text-fill-color:hsl(var(--primary))] [-webkit-text-fill-color:hsl(var(--primary))]">
              Baixe o App nellor
            </h1>
            <p className="text-xl sm:text-2xl text-[#6B7280] mb-16 leading-relaxed">
              Disponível para Android e iOS. Comece a comprar e vender agora mesmo!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Button 
                size="lg" 
                className="h-16 px-10 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-purple-glow hover:shadow-[0_8px_40px_-10px_hsl(var(--primary))] transition-all duration-300"
              >
                <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Baixar na App Store
              </Button>
              <Button 
                size="lg" 
                className="h-16 px-10 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-purple-glow hover:shadow-[0_8px_40px_-10px_hsl(var(--primary))] transition-all duration-300"
              >
                <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Baixar no Google Play
              </Button>
            </div>
            
            <div className="bg-[#F6F0FF] rounded-3xl p-6 sm:p-12 max-w-3xl mx-auto">
              <img 
                src={nellorApp} 
                alt="App nellor preview"
                className="mx-auto w-full max-w-[280px] sm:max-w-sm rounded-3xl shadow-2xl object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Download;
