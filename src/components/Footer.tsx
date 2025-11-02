import { Link } from "react-router-dom";
import { Instagram, Youtube, Twitter, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <h3 className="text-2xl font-heading font-bold">nellor</h3>
            <p className="text-sm text-white/80">
              O marketplace que conecta lojistas e fornecedores em todo o Brasil.
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-white/80 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-sm text-white/80 hover:text-white transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/fornecedor" className="text-sm text-white/80 hover:text-white transition-colors">
                  Sou Fornecedor
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-sm text-white/80 hover:text-white transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold">Redes Sociais</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="font-heading font-semibold">Contato</h4>
            <div className="space-y-2">
              <p className="text-sm text-white/80 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                contato@nellor.com.br
              </p>
              <p className="text-sm text-white/80 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                São Paulo, SP - Brasil
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-white/60">
            © 2025 nellor. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
