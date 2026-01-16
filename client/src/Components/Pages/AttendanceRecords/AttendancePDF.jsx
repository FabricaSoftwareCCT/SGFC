import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Estilos para el PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
        color: '#00843d',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        marginBottom: 20,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#bfbfbf',
        minHeight: 30,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 5,
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#bfbfbf',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#666',
        fontSize: 10,
    },
});

export const AttendancePDF = ({ records }) => {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Registro de Asistencias</Text>
                    <Text style={styles.subtitle}>
                        Generado el {currentDate}
                    </Text>
                </View>

                <View style={styles.table}>
                    {/* Encabezado de la tabla */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.tableCell}>Fecha</Text>
                        <Text style={styles.tableCell}>Curso</Text>
                        <Text style={styles.tableCell}>Participante</Text>
                        <Text style={styles.tableCell}>Estado</Text>
                    </View>

                    {/* Filas de la tabla */}
                    {records.map((record) => (
                        <View key={record.ID} style={styles.tableRow}>
                            <Text style={styles.tableCell}>
                                {format(new Date(record.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </Text>
                            <Text style={styles.tableCell}>
                                {record.Sesion.Curso.nombre_curso}
                            </Text>
                            <Text style={styles.tableCell}>
                                {`${record.aprendiz.nombres} ${record.aprendiz.apellidos}`}
                            </Text>
                            <Text style={styles.tableCell}>
                                {record.estado}
                            </Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.footer}>
                    Sistema de Gestión de Formación Continua - SGFC
                </Text>
            </Page>
        </Document>
    );
};