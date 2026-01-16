"use client"

import { useState, useMemo, useEffect } from "react"
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import "./MonthlyCalendar.css"

// Función parseDate fuera del componente
const parseDate = (dateStr) => {
  if (!dateStr) return null
  try {
    if (dateStr instanceof Date) return dateStr

    if (typeof dateStr === "string") {
      try {
        const isoDate = parseISO(dateStr)
        if (!isNaN(isoDate.getTime())) {
          const adjustedDate = new Date(isoDate.getTime() + isoDate.getTimezoneOffset() * 60000)
          return adjustedDate
        }
      } catch (e) {
        // console.error("Error al parsear fecha ISO:", e)
      }
    }

    return null
  } catch (error) {
    // console.error("Error al parsear fecha:", dateStr, error)
    return null
  }
}

export const MonthlyCalendar = ({ selectedDate, onDateSelect, startDate, endDate, trainingDays = [] }) => {
  // Memoizar las fechas parseadas al inicio
  const parsedStartDate = useMemo(() => {
    const date = parseDate(startDate)
    // console.log("Fecha de inicio parseada:", date ? format(date, "dd/MM/yyyy") : null)
    return date
  }, [startDate])

  const parsedEndDate = useMemo(() => {
    const date = parseDate(endDate)
    // console.log("Fecha de fin parseada:", date ? format(date, "dd/MM/yyyy") : null)
    return date
  }, [endDate])

  // Inicializar currentDate con la fecha de inicio del curso
  const [currentDate, setCurrentDate] = useState(() => {
    const initialDate = parsedStartDate || new Date()
    // console.log("Fecha inicial del calendario:", format(initialDate, "dd/MM/yyyy"))
    return initialDate
  })

  const [selectedDates, setSelectedDates] = useState(new Set())

  // Mapeo de días en español a formato de date-fns
  const dayMapping = {
    // Lunes
    lun: "lun",
    lunes: "lun",
    // Martes
    mar: "mar",
    martes: "mar",
    // Miércoles
    mier: "mié",
    miercoles: "mié",
    mie: "mié",
    miércoles: "mié",
    // Jueves
    jue: "jue",
    jueves: "jue",
    // Viernes
    vie: "vie",
    viernes: "vie",
    // Sábado
    sab: "sáb",
    sabado: "sáb",
    sábado: "sáb",
    // Domingo
    dom: "dom",
    domingo: "dom",
  }

  // Efecto para forzar el mes inicial cuando cambia startDate
  useEffect(() => {
    if (parsedStartDate) {
      // console.log("Actualizando fecha actual a:", format(parsedStartDate, "dd/MM/yyyy"))
      setCurrentDate(parsedStartDate)
    }
  }, [parsedStartDate])

  // Convertir los días de formación a minúsculas para comparación
  const normalizedTrainingDays = useMemo(() => {
    if (!Array.isArray(trainingDays)) return []

    return trainingDays.map((day) => {
      const dayOnly = day.split("-")[0].toLowerCase()
      return dayMapping[dayOnly] || dayOnly
    })
  }, [trainingDays])

  // Función para verificar si un día es de formación
  const isTrainingDay = (date) => {
    const dayOfWeek = format(date, "EEE", { locale: es }).toLowerCase()
    return normalizedTrainingDays.includes(dayOfWeek)
  }

  // Función para verificar si una fecha está dentro del rango del curso
  const isWithinCourseRange = (date) => {
    if (!parsedStartDate || !parsedEndDate) {
      // console.log("Fechas de rango no definidas")
      return false
    }

    // Asegurarse de que todas las fechas se manejen en la zona horaria local
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const compareStart = new Date(parsedStartDate.getFullYear(), parsedStartDate.getMonth(), parsedStartDate.getDate())
    const compareEnd = new Date(parsedEndDate.getFullYear(), parsedEndDate.getMonth(), parsedEndDate.getDate())

    const isInRange = compareDate >= compareStart && compareDate <= compareEnd

    return isInRange
  }

  // Función para verificar si una fecha es seleccionable
  const isSelectable = (date) => {
    return isTrainingDay(date) && isWithinCourseRange(date)
  }

  const handleDateClick = (date) => {
    // Asegurarse de que la fecha se maneje en la zona horaria local
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const formattedDate = format(localDate, "dd/MM/yyyy")

    // console.log("Manejo de clic en fecha:", {
      fechaOriginal: format(date, "dd/MM/yyyy"),
      fechaLocal: formattedDate,
      fechaActualCalendario: format(currentDate, "dd/MM/yyyy"),
      esSeleccionable: isSelectable(localDate),
    })

    if (!isSelectable(localDate)) {
      // console.log("Fecha no seleccionable")
      return
    }

    const dateStr = format(localDate, "yyyy-MM-dd")
    // console.log("Seleccionando fecha:", dateStr)

    setSelectedDates(new Set([dateStr]))
    onDateSelect(dateStr)
  }

  const handleMonthChange = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + direction, 1)

      if (parsedStartDate && parsedEndDate) {
        const newMonthStart = startOfMonth(newDate)
        const newMonthEnd = endOfMonth(newDate)
        const courseStart = startOfMonth(parsedStartDate)
        const courseEnd = endOfMonth(parsedEndDate)

        // console.log("Cambiando mes:", {
          mesAnterior: format(prevDate, "MMMM yyyy", { locale: es }),
          nuevoMes: format(newDate, "MMMM yyyy", { locale: es }),
          inicioCurso: format(courseStart, "dd/MM/yyyy"),
          finCurso: format(courseEnd, "dd/MM/yyyy"),
        })

        if (newMonthEnd < courseStart || newMonthStart > courseEnd) {
          // console.log("Nuevo mes fuera del rango del curso")
          return prevDate
        }
      }

      return newDate
    })
  }

  const renderCalendarDays = () => {
    const days = []
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Semana comienza en lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    let day = startDate
    const weekRows = []
    let currentWeek = []

    while (day <= endDate) {
      // Asegurarse de que la fecha se maneje en la zona horaria local
      const localDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const formattedDate = format(localDay, "yyyy-MM-dd")
      const isCurrentMonth = isSameMonth(localDay, currentDate)
      const isSelectableDay = isSelectable(localDay)
      const isSelected = selectedDates.has(formattedDate)
      const isTraining = isTrainingDay(localDay)
      const isInRange = isWithinCourseRange(localDay)

      currentWeek.push(
        <div
          key={formattedDate}
          className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} 
                    ${isTraining && isInRange ? "training-day" : ""} 
                    ${isSelected ? "selected" : ""}`}
          onClick={() => handleDateClick(localDay)}
        >
          {format(localDay, "d")}
        </div>,
      )

      // Si es el último día de la semana, agregar la semana actual a las filas
      if (format(day, "E") === "7") {
        weekRows.push(
          <div key={`week-${weekRows.length}`} className="calendar-week">
            {currentWeek}
          </div>,
        )
        currentWeek = []
      }

      day = addDays(day, 1)
    }

    // Agregar la última semana si hay días pendientes
    if (currentWeek.length > 0) {
      weekRows.push(
        <div key={`week-${weekRows.length}`} className="calendar-week">
          {currentWeek}
        </div>,
      )
    }

    return weekRows
  }

  return (
    <div className="simple-calendar-container">

      <div className="month-title">{format(currentDate, "MMMM", { locale: es }).toUpperCase()}</div>


      <div className="simple-calendar-weekdays">
        <div className="weekday">LUN</div>
        <div className="weekday">MAR</div>
        <div className="weekday">MIÉ</div>
        <div className="weekday">JUE</div>
        <div className="weekday">VIE</div>
        <div className="weekday">SÁB</div>
        <div className="weekday">DOM</div>
      </div>

      <div className="simple-calendar-grid">{renderCalendarDays()}</div>
    </div>
  )
}
export default MonthlyCalendar