import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const configItems = [
  { label: "Nome da Plataforma", value: "Nellor", editable: false },
  { label: "Tema Atual", value: "Roxo Escuro", editable: false },
  { label: "Comissão Padrão", value: "5%", editable: false },
  { label: "Contato de Suporte", value: "suporte@nellor.com", editable: false },
];

const Configuracoes = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-violet-900 bg-clip-text text-transparent mb-2">
          ⚙️ Configurações
        </h1>
        <p className="text-muted-foreground">Informações da plataforma (apenas visualização)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle>Dados da Plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {configItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                <span className="text-muted-foreground">{item.label}:</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <CardTitle>Status dos Servidores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">API Principal:</span>
              <Badge className="bg-green-500 hover:bg-green-600">🟢 Online</Badge>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Banco de Dados:</span>
              <Badge className="bg-green-500 hover:bg-green-600">🟢 Online</Badge>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Sistema de Pagamentos:</span>
              <Badge className="bg-green-500 hover:bg-green-600">🟢 Online</Badge>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">CDN de Imagens:</span>
              <Badge className="bg-green-500 hover:bg-green-600">🟢 Online</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-purple-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>ℹ️ Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Este painel administrativo está em modo de visualização. As funcionalidades de edição e configuração 
              avançada serão habilitadas em futuras atualizações.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Versão do Sistema</p>
                <p className="font-bold text-lg">v1.0.0</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Última Atualização</p>
                <p className="font-bold text-lg">02/11/2024</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                <p className="font-bold text-lg">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;
