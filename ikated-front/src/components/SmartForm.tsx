'use client'

import React, { useState, useEffect } from 'react'
import { FileUpload } from './FileUpload'
import { Wand2, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface FormData {
  // Informações Pessoais
  nomeCompleto: string
  cpf: string
  rg: string
  dataNascimento: string

  // Contato
  email: string
  telefone: string

  // Endereço (extraído da conta de luz/água)
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  estado: string
}

const initialFormData: FormData = {
  nomeCompleto: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  email: '',
  telefone: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: ''
}

export function SmartForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const simulateAIProcessing = async () => {
    if (uploadedFiles.length === 0) {
      alert('Por favor, carregue pelo menos um documento para usar a IA.')
      return
    }

    setIsProcessing(true)
    setProcessingMessage('Enviando documentos para análise...')

    try {
      // Enviar documentos para o backend Nest.js
      const formData = new FormData()
      uploadedFiles.forEach((uploadedFile, index) => {
        formData.append(`documents`, uploadedFile.file)
      })

      setProcessingMessage('Processando documentos no backend...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documents/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Falha na análise dos documentos')
      }

      const analysisResult = await response.json()

      setProcessingMessage('Preenchendo formulário com dados extraídos...')

      // Preencher formulário com dados extraídos pelo backend
      if (analysisResult.extractedData) {
        setFormData(prev => ({ ...prev, ...analysisResult.extractedData }))
      }

      setIsProcessing(false)
      setProcessingMessage('')
    } catch (error) {
      console.error('Erro na análise com backend:', error)

      // Fallback: simulação local se backend não estiver disponível
      setProcessingMessage('Backend indisponível, usando simulação local...')

      const steps = [
        'Extraindo texto dos documentos...',
        'Identificando informações pessoais...',
        'Validando dados encontrados...',
        'Preenchendo formulário automaticamente...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setProcessingMessage(steps[i])
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Dados simulados para demonstração
      const simulatedData: Partial<FormData> = {
        nomeCompleto: 'João da Silva Santos',
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        dataNascimento: '1985-05-15',
        email: 'joao.santos@email.com',
        telefone: '(11) 98765-4321',
        cep: '01234-567',
        endereco: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP'
      }

      setFormData(prev => ({ ...prev, ...simulatedData }))
      setIsProcessing(false)
      setProcessingMessage('')
    }
  }

  const formSections = [
    {
      title: 'Informações Pessoais',
      icon: <CheckCircle className="w-5 h-5" />,
      fields: [
        { key: 'nomeCompleto', label: 'Nome Completo', type: 'text', required: true },
        { key: 'cpf', label: 'CPF', type: 'text', required: true },
        { key: 'rg', label: 'RG', type: 'text', required: true },
        { key: 'dataNascimento', label: 'Data de Nascimento', type: 'date', required: true }
      ]
    },
    {
      title: 'Contato',
      icon: <AlertCircle className="w-5 h-5" />,
      fields: [
        { key: 'email', label: 'E-mail', type: 'email', required: true },
        { key: 'telefone', label: 'Telefone', type: 'tel', required: true }
      ]
    },
    {
      title: 'Endereço',
      icon: <CheckCircle className="w-5 h-5" />,
      fields: [
        { key: 'cep', label: 'CEP', type: 'text', required: true },
        { key: 'endereco', label: 'Endereço', type: 'text', required: true },
        { key: 'numero', label: 'Número', type: 'text', required: true },
        { key: 'bairro', label: 'Bairro', type: 'text', required: true },
        { key: 'cidade', label: 'Cidade', type: 'text', required: true },
        { key: 'estado', label: 'Estado', type: 'select', required: true, options: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] }
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Upload de Documentos
          </h3>
          <p className="text-muted-foreground">
            Carregue seus documentos (RG, CPF e conta de luz/água) para preenchimento automático
          </p>
        </div>

        <FileUpload
          onFilesUploaded={setUploadedFiles}
          acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
          maxFiles={10}
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <button
              onClick={simulateAIProcessing}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              <span>
                {isProcessing ? processingMessage : 'Preencher com IA'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {formSections.map((section, sectionIndex) => (
          <div key={section.title} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="text-primary">
                {section.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {section.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key as keyof FormData]}
                      onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecione...</option>
                      {(field as any).options?.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key as keyof FormData]}
                      onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                      placeholder={`Digite ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key as keyof FormData]}
                      onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={`Digite ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-6">
        <button className="flex items-center space-x-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Save className="w-5 h-5" />
          <span>Salvar Formulário</span>
        </button>
      </div>
    </div>
  )
}