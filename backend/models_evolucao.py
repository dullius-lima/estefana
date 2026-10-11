from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from database import Base

class EvolucaoClinica(Base):
    __tablename__ = "evolucoes_clinicas"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, index=True)
    prontuario = Column(String(50), index=True)
    autor = Column(String(100))
    cargo = Column(String(100))
    data_hora_formatada = Column(String(50))
    conteudo_soap = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Campo vetor/texto preparado para consulta RAG / IA
    memoria_ia_context = Column(Text, nullable=True)
